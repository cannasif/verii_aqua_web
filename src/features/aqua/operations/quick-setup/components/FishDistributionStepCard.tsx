import { type ReactElement } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { isDistributionValid } from '../schema/quick-setup-schema';
import type { CageAllocationRow, CageOptionDto } from '../types/quick-setup-types';
import { distributeEqually, assignAllToCage } from '../utils/quick-operations';

interface FishDistributionStepCardProps {
  allocations: CageAllocationRow[];
  totalFishCount: number;
  onAllocationsChange: (rows: CageAllocationRow[]) => void;
  onSaveAndPost: () => void;
  isPosting: boolean;
  selectedCageId: number | null;
  onSelectCage: (projectCageId: number | null) => void;
  availableCages: CageOptionDto[];
  selectedAvailableCageId: number | null;
  onSelectAvailableCage: (cageId: number | null) => void;
  onAddCage: () => void;
  isAddingCage: boolean;
}

export function FishDistributionStepCard({
  allocations,
  totalFishCount,
  onAllocationsChange,
  onSaveAndPost,
  isPosting,
  selectedCageId,
  onSelectCage,
  availableCages,
  selectedAvailableCageId,
  onSelectAvailableCage,
  onAddCage,
  isAddingCage,
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
    <Card className="bg-[#1a1025]/60 backdrop-blur-xl border border-white/5 shadow-sm rounded-2xl overflow-hidden transition-all duration-300">
      <CardHeader className="border-b border-white/5 px-6 py-5 bg-transparent">
        <CardTitle className="text-xl font-bold tracking-tight text-white">{t('aqua.quickSetup.step3Title')}</CardTitle>
      </CardHeader>
      <CardContent className="p-6 space-y-6">
        <div className="flex items-center justify-between gap-4 flex-wrap bg-white/2 border border-white/5 p-4 rounded-xl">
          <div className="flex items-center gap-3 flex-wrap">
              <div className="min-w-[220px]">
                <Select
                  value={selectedAvailableCageId != null ? String(selectedAvailableCageId) : undefined}
                  onValueChange={(value) => onSelectAvailableCage(value ? Number(value) : null)}
                >
                  <SelectTrigger className="bg-[#0b0713] border-white/10 text-white">
                    <SelectValue
                      placeholder={t('aqua.quickSetup.selectAvailableCage', { defaultValue: 'Boş kafes seçin' })}
                    />
                  </SelectTrigger>
                  <SelectContent className="bg-[#0b0713] border-white/10">
                    {availableCages.map((cage) => (
                      <SelectItem key={cage.id} value={String(cage.id)} className="focus:bg-white/5 focus:text-white cursor-pointer">
                        {cage.cageCode ?? cage.cageName ?? String(cage.id)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button
                type="button"
                variant="outline"
                className="bg-transparent border-white/10 text-white hover:bg-white/5"
                onClick={onAddCage}
                disabled={selectedAvailableCageId == null || isAddingCage}
              >
                {t('aqua.quickSetup.addCage', { defaultValue: '+ Kafes Ekle' })}
              </Button>
          </div>
          
          <div className="flex items-center gap-3 flex-wrap">
              <Button type="button" variant="outline" className="bg-transparent border-white/10 text-white hover:bg-white/5" onClick={handleEqualDistribute}>
                {t('aqua.quickSetup.equalDistribute')}
              </Button>
              <Button
                type="button"
                variant="outline"
                className="bg-transparent border-white/10 text-white hover:bg-white/5"
                onClick={handleAssignAllToSelected}
                disabled={selectedCageId == null}
              >
                {t('aqua.quickSetup.assignAllToSelectedCage')}
              </Button>
              <Badge className={`px-3 py-1.5 rounded-lg font-medium border-0 ${isValid ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                {isValid ? t('aqua.quickSetup.distributionMatch') : t('aqua.quickSetup.distributionMismatch')}
              </Badge>
          </div>
        </div>

        <div className="rounded-xl border border-white/5 overflow-hidden bg-white/1">
            <Table>
            <TableHeader className="bg-white/2 border-b border-white/5">
                <TableRow className="hover:bg-transparent border-0">
                <TableHead className="text-slate-400 font-semibold">{t('aqua.quickSetup.cage')}</TableHead>
                <TableHead className="text-slate-400 font-semibold w-[200px]">{t('aqua.quickSetup.count')}</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {allocations.length === 0 ? (
                <TableRow className="border-0 hover:bg-transparent">
                    <TableCell colSpan={2} className="text-slate-500 text-center py-8">
                    {t('aqua.quickSetup.noAvailableCages', {
                        defaultValue: 'Bu proje için kullanılabilir kafes bulunamadı.',
                    })}
                    </TableCell>
                </TableRow>
                ) : (
                allocations.map((row) => (
                    <TableRow
                    key={row.projectCageId}
                    className={`border-b border-white/5 transition-colors cursor-pointer ${selectedCageId === row.projectCageId ? 'bg-pink-500/10 hover:bg-pink-500/10' : 'hover:bg-white/5'}`}
                    onClick={() =>
                        onSelectCage(selectedCageId === row.projectCageId ? null : row.projectCageId)
                    }
                    >
                    <TableCell className="font-medium text-slate-200">
                        {row.cageCode ?? row.cageName ?? String(row.projectCageId)}
                    </TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                        <Input
                        type="number"
                        min={0}
                        step={1}
                        value={row.fishCount}
                        className="bg-[#0b0713] border-white/10 text-white focus-visible:ring-pink-500/20 focus-visible:border-pink-500 h-9"
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
        </div>

        <div className="flex items-center justify-between pt-2">
            <div className="text-sm font-medium text-slate-400 bg-white/2 px-4 py-2 rounded-lg border border-white/5">
            {t('aqua.quickSetup.total')}: <span className={isValid ? 'text-emerald-400' : 'text-red-400'}>{totalAllocated}</span> / {totalFishCount}
            </div>
            <Button
            type="button"
            className="bg-linear-to-r from-pink-600 to-orange-600 text-white hover:opacity-90 border-0 h-11 px-8 rounded-xl shadow-lg shadow-pink-500/20"
            onClick={onSaveAndPost}
            disabled={!isValid || isPosting}
            >
            {t('aqua.quickSetup.saveAndPost')}
            </Button>
        </div>
      </CardContent>
    </Card>
  );
}