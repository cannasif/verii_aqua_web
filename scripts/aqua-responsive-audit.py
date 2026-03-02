import base64
import json
import os
import time
import urllib.request
import urllib.error

WD = "http://127.0.0.1:5555"
BASE_URL = "http://127.0.0.1:5173"

ROUTES = [
    "/aqua/definitions/projects",
    "/aqua/definitions/cages",
    "/aqua/definitions/project-cage-assignments",
    "/aqua/definitions/weather-severities",
    "/aqua/definitions/weather-types",
    "/aqua/definitions/net-operation-types",
    "/aqua/operations/quick-setup",
    "/aqua/operations/quick-daily-entry",
    "/aqua/operations/goods-receipts",
    "/aqua/operations/feedings",
    "/aqua/operations/mortalities",
    "/aqua/operations/transfers",
    "/aqua/operations/shipments",
    "/aqua/operations/stock-converts",
    "/aqua/operations/daily-weathers",
    "/aqua/operations/net-operations",
    "/aqua/operations/goods-receipt-lines",
    "/aqua/operations/goods-receipt-fish-distributions",
    "/aqua/operations/feeding-lines",
    "/aqua/operations/feeding-distributions",
    "/aqua/operations/transfer-lines",
    "/aqua/operations/shipment-lines",
    "/aqua/operations/mortality-lines",
    "/aqua/operations/stock-convert-lines",
    "/aqua/operations/net-operation-lines",
    "/aqua/reports/batch-movements",
    "/aqua/reports/cage-balances",
    "/aqua/reports/project-detail",
]

VIEWPORTS = [
    {"name": "iphone-se", "width": 375, "height": 667},
    {"name": "ipad", "width": 768, "height": 1024},
    {"name": "desktop-1366", "width": 1366, "height": 768},
]


def req(method, path, payload=None):
    data = None
    headers = {"Content-Type": "application/json"}
    if payload is not None:
        data = json.dumps(payload).encode("utf-8")
    r = urllib.request.Request(WD + path, data=data, method=method, headers=headers)
    try:
        with urllib.request.urlopen(r, timeout=30) as resp:
            text = resp.read().decode("utf-8")
            return json.loads(text) if text else {}
    except urllib.error.HTTPError as e:
        raw = e.read().decode("utf-8", errors="ignore")
        try:
            parsed = json.loads(raw) if raw else {}
        except Exception:
            parsed = {"raw": raw}
        raise RuntimeError(f"HTTP {e.code} {path}: {parsed}") from e


def sanitize(route):
    s = route.strip("/").replace("/", "__")
    return s if s else "root"


def create_session():
    payload = {
        "capabilities": {
            "alwaysMatch": {
                "browserName": "safari",
                "acceptInsecureCerts": True,
            }
        }
    }
    v = req("POST", "/session", payload)
    sid = v.get("sessionId") or (v.get("value") or {}).get("sessionId")
    if not sid:
        raise RuntimeError(f"Session not created: {v}")
    return sid


def delete_session(sid):
    try:
        req("DELETE", f"/session/{sid}")
    except Exception:
        pass


def set_window(sid, w, h):
    req("POST", f"/session/{sid}/window/rect", {"x": 0, "y": 0, "width": w, "height": h})


def navigate(sid, url):
    req("POST", f"/session/{sid}/url", {"url": url})


def current_url(sid):
    v = req("GET", f"/session/{sid}/url")
    return (v.get("value") or "") if isinstance(v.get("value"), str) else ""


def execute_js(sid, script):
    v = req("POST", f"/session/{sid}/execute/sync", {"script": script, "args": []})
    return v.get("value")


def screenshot(sid):
    v = req("GET", f"/session/{sid}/screenshot")
    return v.get("value")


def main():
    ts = time.strftime("%Y%m%d-%H%M%S")
    out_root = f"/tmp/aqua-responsive-audit-{ts}"
    os.makedirs(out_root, exist_ok=True)

    report = {
        "generatedAt": time.strftime("%Y-%m-%dT%H:%M:%S"),
        "baseUrl": BASE_URL,
        "outputDir": out_root,
        "results": [],
    }

    for vp in VIEWPORTS:
        sid = None
        vp_dir = os.path.join(out_root, vp["name"])
        os.makedirs(vp_dir, exist_ok=True)
        try:
            sid = create_session()
            set_window(sid, vp["width"], vp["height"])
            for route in ROUTES:
                url = BASE_URL + route
                item = {
                    "viewport": vp["name"],
                    "route": route,
                    "url": url,
                    "status": "PASS",
                    "reasons": [],
                }
                try:
                    navigate(sid, url)
                    time.sleep(1.8)
                    cur = current_url(sid)
                    item["finalUrl"] = cur

                    metrics = execute_js(
                        sid,
                        "return {"
                        "w: window.innerWidth || 0,"
                        "sw: document.documentElement.scrollWidth || 0,"
                        "sh: document.documentElement.scrollHeight || 0,"
                        "hasModal: !!document.querySelector('[role=\"dialog\"], [data-state=\"open\"]'),"
                        "};",
                    ) or {}

                    inner = int(metrics.get("w") or 0)
                    scroll_w = int(metrics.get("sw") or 0)
                    item["metrics"] = {"innerWidth": inner, "scrollWidth": scroll_w, "scrollHeight": int(metrics.get("sh") or 0)}

                    if "/auth/login" in (cur or ""):
                        item["status"] = "FAIL"
                        item["reasons"].append("redirected_to_login")

                    if scroll_w > inner + 1:
                        item["status"] = "FAIL"
                        item["reasons"].append("horizontal_overflow")

                    b64 = screenshot(sid)
                    if b64:
                        fn = sanitize(route) + ".png"
                        fp = os.path.join(vp_dir, fn)
                        with open(fp, "wb") as f:
                            f.write(base64.b64decode(b64))
                        item["screenshot"] = fp
                except Exception as e:
                    item["status"] = "FAIL"
                    item["reasons"].append("automation_error")
                    item["error"] = str(e)

                report["results"].append(item)
        except RuntimeError as e:
            msg = str(e)
            if "Allow remote automation" in msg:
                print(
                    json.dumps(
                        {
                            "error": "safari_remote_automation_disabled",
                            "message": "Safari > Settings > Advanced > Show Develop menu, then Develop > Allow Remote Automation açılmalı.",
                            "details": msg,
                        },
                        ensure_ascii=False,
                        indent=2,
                    )
                )
                return
            raise
        finally:
            if sid is not None:
                delete_session(sid)

    report_path = os.path.join(out_root, "report.json")
    with open(report_path, "w", encoding="utf-8") as f:
        json.dump(report, f, ensure_ascii=False, indent=2)

    by_vp = {}
    for r in report["results"]:
        by_vp.setdefault(r["viewport"], {"PASS": 0, "FAIL": 0})
        by_vp[r["viewport"]][r["status"]] += 1

    print(json.dumps({"outputDir": out_root, "report": report_path, "summary": by_vp}, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
