import { type ReactElement } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { isDistributionValid } from '../schema/quick-setup-schema';
import type { CageAllocationRow } from '../types/quick-setup-types';
import { distributeEqually, assignAllToCage } from '../utils/quick-operations';

interface FishDistributionStepCardProps {
  allocations: CageAllocationRow[];
  totalFishCount: number;
  onAllocationsChange: (rows: CageAllocationRow[]) => void;
  onSaveAndPost: () => void;
  isPosting: boolean;
  selectedCageId: number | null;
  onSelectCage: (projectCageId: number | null) => void;
}

export function FishDistributionStepCard({
  allocations,
  totalFishCount,
  onAllocationsChange,
  onSaveAndPost,
  isPosting,
  selectedCageId,
  onSelectCage,
}: FishDistributionStepCardProps): ReactElement {
  const { t } = useTranslation('common');
  const totalAllocated = allocations.reduce((acc, row) => acc + row.fishCount, 0);
  const isValid = isDistributionValid(allocations, totalFishCount);

  const handleEqualDistribute = (): void => {
    const next = distributeEqually(allocations, totalFishCount);
    onAllocationsChange(next);
  };

  const handleAssignAllToSelected = (): void => {
    if (selectedCageId == null) return;
    const next = assignAllToCage(allocations, selectedCageId, totalFishCount);
    onAllocationsChange(next);
  };

  const setFishCount = (projectCageId: number, value: number): void => {
    const clamped = Math.max(0, Math.floor(Number(value)));
    const next = allocations.map((row) =>
      row.projectCageId === projectCageId ? { ...row, fishCount: clamped } : row
    );
    onAllocationsChange(next);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('aqua.quickSetup.step3Title')}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-2 flex-wrap">
          <Button type="button" variant="outline" size="sm" onClick={handleEqualDistribute}>
            {t('aqua.quickSetup.equalDistribute')}
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleAssignAllToSelected}
            disabled={selectedCageId == null}
          >
            {t('aqua.quickSetup.assignAllToSelectedCage')}
          </Button>
          <Badge variant={isValid ? 'default' : 'destructive'}>
            {isValid ? t('aqua.quickSetup.distributionMatch') : t('aqua.quickSetup.distributionMismatch')}
          </Badge>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('aqua.quickSetup.cage')}</TableHead>
              <TableHead>{t('aqua.quickSetup.count')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {allocations.length === 0 ? (
              <TableRow>
                <TableCell colSpan={2} className="text-muted-foreground">
                  {t('aqua.quickSetup.noAvailableCages', {
                    defaultValue: 'Bu proje için kullanılabilir kafes bulunamadı.',
                  })}
                </TableCell>
              </TableRow>
            ) : (
              allocations.map((row) => (
                <TableRow
                  key={row.projectCageId}
                  className={selectedCageId === row.projectCageId ? 'bg-muted/50' : undefined}
                  onClick={() =>
                    onSelectCage(selectedCageId === row.projectCageId ? null : row.projectCageId)
                  }
                >
                  <TableCell>
                    {row.cageCode ?? row.cageName ?? String(row.projectCageId)}
                  </TableCell>
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <Input
                      type="number"
                      min={0}
                      step={1}
                      value={row.fishCount}
                      onChange={(e) =>
                        setFishCount(row.projectCageId, e.target.value ? Number(e.target.value) : 0)
                      }
                    />
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
        <div className="text-sm text-muted-foreground">
          {t('aqua.quickSetup.total')}: {totalAllocated} / {totalFishCount}
        </div>
        <Button
          type="button"
          onClick={onSaveAndPost}
          disabled={!isValid || isPosting}
        >
          {t('aqua.quickSetup.saveAndPost')}
        </Button>
      </CardContent>
    </Card>
  );
}
