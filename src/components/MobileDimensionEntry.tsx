/**
 * Part 17 — Mobile Dimension Entry Component
 * Full-screen line editor for phone-based MB entry
 */

import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Camera, Check, Plus, Minus } from 'lucide-react';
import { DimensionCalculator, applyRounding } from '../utils/dimensionCalculator';
import type { MbDimension, FormulaCode } from '../types/measurement';

interface MobileDimensionEntryProps {
  lineDescription: string;
  uom: string;
  formulaCode: FormulaCode;
  existingDimensions: MbDimension[];
  onSave: (dimensions: MbDimension[]) => void;
  onCancel: () => void;
}

export function MobileDimensionEntry({
  lineDescription,
  uom,
  formulaCode,
  existingDimensions,
  onSave,
  onCancel,
}: MobileDimensionEntryProps) {
  const [dimensions, setDimensions] = useState<MbDimension[]>(existingDimensions);
  const [currentDimIndex, setCurrentDimIndex] = useState(0);
  const [currentDim, setCurrentDim] = useState<Partial<MbDimension>>(
    existingDimensions[0] || { dimType: 'ADD', formulaCode, seqNo: 1 }
  );

  const addDimension = () => {
    const newDim: Partial<MbDimension> = {
      dimType: 'ADD',
      formulaCode,
      seqNo: dimensions.length + 1,
      nos: 1,
    };
    setDimensions([...dimensions, newDim as MbDimension]);
    setCurrentDim(newDim);
    setCurrentDimIndex(dimensions.length);
  };

  const removeDimension = () => {
    if (dimensions.length <= 1) return;
    const newDimensions = dimensions.filter((_, i) => i !== currentDimIndex);
    setDimensions(newDimensions);
    setCurrentDimIndex(Math.max(0, currentDimIndex - 1));
    setCurrentDim(newDimensions[Math.max(0, currentDimIndex - 1)] || {});
  };

  const updateDimension = (field: keyof MbDimension, value: number | string) => {
    const updated = { ...currentDim, [field]: value };
    setCurrentDim(updated);
    
    const newDimensions = [...dimensions];
    newDimensions[currentDimIndex] = updated as MbDimension;
    setDimensions(newDimensions);
  };

  const computeTotalQuantity = (): number => {
    return dimensions.reduce((sum, dim) => {
      try {
        const inputs: Record<string, number | number[]> = {};
        if (dim.nos !== undefined) inputs.nos = dim.nos;
        if (dim.length !== undefined) inputs.length = dim.length;
        if (dim.breadth !== undefined) inputs.breadth = dim.breadth;
        if (dim.height !== undefined) inputs.height = dim.height;
        if (dim.diameter !== undefined) inputs.diameter = dim.diameter;
        if (dim.radius !== undefined) inputs.radius = dim.radius;
        if (dim.areaDirect !== undefined) inputs.area_direct = dim.areaDirect;
        if (dim.volumeDirect !== undefined) inputs.volume_direct = dim.volumeDirect;
        if (dim.barDiaMm !== undefined) inputs.bar_dia_mm = dim.barDiaMm;
        if (dim.barCount !== undefined) inputs.bar_count = dim.barCount;
        if (dim.barLength !== undefined) inputs.bar_length = dim.barLength;
        if (dim.unitWeight !== undefined) inputs.unit_weight = dim.unitWeight;

        const result = DimensionCalculator.computeQuantity(dim.formulaCode, inputs);
        return sum + (dim.dimType === 'ADD' ? result.quantity : -result.quantity);
      } catch (error) {
        return sum;
      }
    }, 0);
  };

  const totalQty = applyRounding(computeTotalQuantity(), uom);

  const handleSave = () => {
    onSave(dimensions);
  };

  const navigateDimension = (direction: 'prev' | 'next') => {
    if (direction === 'prev' && currentDimIndex > 0) {
      setCurrentDimIndex(currentDimIndex - 1);
      setCurrentDim(dimensions[currentDimIndex - 1]);
    } else if (direction === 'next' && currentDimIndex < dimensions.length - 1) {
      setCurrentDimIndex(currentDimIndex + 1);
      setCurrentDim(dimensions[currentDimIndex + 1]);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col" style={{ background: 'var(--sapBackgroundColor)' }}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b" style={{ 
        background: 'var(--sapShellColor)',
        borderColor: 'var(--sapList_BorderColor)',
      }}>
        <button
          onClick={onCancel}
          className="p-2 rounded hover:bg-[var(--sapButton_Hover_Background)]"
        >
          <ChevronLeft size={24} />
        </button>
        <div className="flex-1 text-center">
          <div className="text-sm font-semibold" style={{ color: 'var(--sapTextColor)' }}>
            Dimension Entry
          </div>
          <div className="text-xs" style={{ color: 'var(--sapContent_LabelColor)' }}>
            {lineDescription}
          </div>
        </div>
        <button
          onClick={handleSave}
          className="p-2 rounded hover:bg-[var(--sapButton_Hover_Background)]"
        >
          <Check size={24} style={{ color: 'var(--sapPositiveColor)' }} />
        </button>
      </div>

      {/* Computed Quantity Display */}
      <div className="p-4" style={{ background: 'var(--sapInformationBackground)' }}>
        <div className="text-center">
          <div className="text-xs mb-1" style={{ color: 'var(--sapInformativeTextColor)' }}>
            Computed Quantity
          </div>
          <div className="text-4xl font-bold" style={{ color: 'var(--sapInformativeTextColor)' }}>
            {totalQty}
          </div>
          <div className="text-sm" style={{ color: 'var(--sapInformativeTextColor)' }}>
            {uom}
          </div>
        </div>
      </div>

      {/* Dimension Navigation */}
      <div className="flex items-center justify-between p-4 border-b" style={{ borderColor: 'var(--sapList_BorderColor)' }}>
        <button
          onClick={() => navigateDimension('prev')}
          disabled={currentDimIndex === 0}
          className="p-2 rounded disabled:opacity-30"
        >
          <ChevronLeft size={24} />
        </button>
        <div className="text-sm font-semibold" style={{ color: 'var(--sapTextColor)' }}>
          Dimension {currentDimIndex + 1} of {dimensions.length}
        </div>
        <button
          onClick={() => navigateDimension('next')}
          disabled={currentDimIndex === dimensions.length - 1}
          className="p-2 rounded disabled:opacity-30"
        >
          <ChevronRight size={24} />
        </button>
      </div>

      {/* Dimension Entry Form */}
      <div className="flex-1 overflow-auto p-4 space-y-4">
        {/* Dimension Type */}
        <div>
          <label className="block text-sm font-medium mb-2" style={{ color: 'var(--sapTextColor)' }}>
            Type
          </label>
          <div className="flex gap-2">
            <button
              onClick={() => updateDimension('dimType', 'ADD')}
              className={`flex-1 py-3 rounded text-sm font-medium ${
                currentDim.dimType === 'ADD'
                  ? 'bg-[var(--sapButton_Emphasized_Background)] text-[var(--sapButton_Emphasized_TextColor)]'
                  : 'bg-[var(--sapButton_Background)] text-[var(--sapButton_TextColor)]'
              }`}
              style={{ border: '1px solid var(--sapButton_BorderColor)' }}
            >
              <Plus size={16} className="inline mr-1" />
              Add
            </button>
            <button
              onClick={() => updateDimension('dimType', 'DEDUCT')}
              className={`flex-1 py-3 rounded text-sm font-medium ${
                currentDim.dimType === 'DEDUCT'
                  ? 'bg-[var(--sapButton_Reject_Background)] text-[var(--sapButton_Reject_TextColor)]'
                  : 'bg-[var(--sapButton_Background)] text-[var(--sapButton_TextColor)]'
              }`}
              style={{ border: '1px solid var(--sapButton_BorderColor)' }}
            >
              <Minus size={16} className="inline mr-1" />
              Deduct
            </button>
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium mb-2" style={{ color: 'var(--sapTextColor)' }}>
            Description
          </label>
          <input
            type="text"
            value={currentDim.description || ''}
            onChange={(e) => updateDimension('description', e.target.value)}
            className="w-full px-3 py-3 rounded border text-base"
            style={{
              background: 'var(--sapField_Background)',
              borderColor: 'var(--sapField_BorderColor)',
              color: 'var(--sapField_TextColor)',
            }}
            placeholder="Enter description..."
          />
        </div>

        {/* Number of Units */}
        <div>
          <label className="block text-sm font-medium mb-2" style={{ color: 'var(--sapTextColor)' }}>
            Number of Units (Nos)
          </label>
          <input
            type="number"
            value={currentDim.nos || 1}
            onChange={(e) => updateDimension('nos', parseFloat(e.target.value) || 1)}
            className="w-full px-3 py-3 rounded border text-base"
            style={{
              background: 'var(--sapField_Background)',
              borderColor: 'var(--sapField_BorderColor)',
              color: 'var(--sapField_TextColor)',
            }}
            inputMode="decimal"
          />
        </div>

        {/* Formula-specific inputs */}
        {formulaCode === 'LINEAR' && (
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--sapTextColor)' }}>
              Length (m)
            </label>
            <input
              type="number"
              value={currentDim.length || ''}
              onChange={(e) => updateDimension('length', parseFloat(e.target.value) || 0)}
              className="w-full px-3 py-3 rounded border text-base"
              style={{
                background: 'var(--sapField_Background)',
                borderColor: 'var(--sapField_BorderColor)',
                color: 'var(--sapField_TextColor)',
              }}
              inputMode="decimal"
              step="0.001"
            />
          </div>
        )}

        {(formulaCode === 'AREA_LB' || formulaCode === 'VOLUME_LBH') && (
          <>
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--sapTextColor)' }}>
                Length (m)
              </label>
              <input
                type="number"
                value={currentDim.length || ''}
                onChange={(e) => updateDimension('length', parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-3 rounded border text-base"
                style={{
                  background: 'var(--sapField_Background)',
                  borderColor: 'var(--sapField_BorderColor)',
                  color: 'var(--sapField_TextColor)',
                }}
                inputMode="decimal"
                step="0.001"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--sapTextColor)' }}>
                Breadth (m)
              </label>
              <input
                type="number"
                value={currentDim.breadth || ''}
                onChange={(e) => updateDimension('breadth', parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-3 rounded border text-base"
                style={{
                  background: 'var(--sapField_Background)',
                  borderColor: 'var(--sapField_BorderColor)',
                  color: 'var(--sapField_TextColor)',
                }}
                inputMode="decimal"
                step="0.001"
              />
            </div>
          </>
        )}

        {formulaCode === 'VOLUME_LBH' && (
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--sapTextColor)' }}>
              Height (m)
            </label>
            <input
              type="number"
              value={currentDim.height || ''}
              onChange={(e) => updateDimension('height', parseFloat(e.target.value) || 0)}
              className="w-full px-3 py-3 rounded border text-base"
              style={{
                background: 'var(--sapField_Background)',
                borderColor: 'var(--sapField_BorderColor)',
                color: 'var(--sapField_TextColor)',
              }}
              inputMode="decimal"
              step="0.001"
            />
          </div>
        )}

        {formulaCode === 'STEEL_WEIGHT' && (
          <>
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--sapTextColor)' }}>
                Bar Count
              </label>
              <input
                type="number"
                value={currentDim.barCount || ''}
                onChange={(e) => updateDimension('barCount', parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-3 rounded border text-base"
                style={{
                  background: 'var(--sapField_Background)',
                  borderColor: 'var(--sapField_BorderColor)',
                  color: 'var(--sapField_TextColor)',
                }}
                inputMode="decimal"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--sapTextColor)' }}>
                Bar Length (m)
              </label>
              <input
                type="number"
                value={currentDim.barLength || ''}
                onChange={(e) => updateDimension('barLength', parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-3 rounded border text-base"
                style={{
                  background: 'var(--sapField_Background)',
                  borderColor: 'var(--sapField_BorderColor)',
                  color: 'var(--sapField_TextColor)',
                }}
                inputMode="decimal"
                step="0.001"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--sapTextColor)' }}>
                Bar Diameter (mm)
              </label>
              <input
                type="number"
                value={currentDim.barDiaMm || ''}
                onChange={(e) => updateDimension('barDiaMm', parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-3 rounded border text-base"
                style={{
                  background: 'var(--sapField_Background)',
                  borderColor: 'var(--sapField_BorderColor)',
                  color: 'var(--sapField_TextColor)',
                }}
                inputMode="decimal"
                step="0.1"
              />
            </div>
          </>
        )}

        {formulaCode === 'DIRECT' && (
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--sapTextColor)' }}>
              Direct Quantity ({uom})
            </label>
            <input
              type="number"
              value={currentDim.volumeDirect || ''}
              onChange={(e) => updateDimension('volumeDirect', parseFloat(e.target.value) || 0)}
              className="w-full px-3 py-3 rounded border text-base"
              style={{
                background: 'var(--sapField_Background)',
                borderColor: 'var(--sapField_BorderColor)',
                color: 'var(--sapField_TextColor)',
              }}
              inputMode="decimal"
              step="0.001"
            />
          </div>
        )}

        {/* Remark */}
        <div>
          <label className="block text-sm font-medium mb-2" style={{ color: 'var(--sapTextColor)' }}>
            Remark
          </label>
          <textarea
            value={currentDim.remark || ''}
            onChange={(e) => updateDimension('remark', e.target.value)}
            className="w-full px-3 py-3 rounded border text-base"
            style={{
              background: 'var(--sapField_Background)',
              borderColor: 'var(--sapField_BorderColor)',
              color: 'var(--sapField_TextColor)',
            }}
            rows={2}
            placeholder="Optional remark..."
          />
        </div>

        {/* Photo Capture */}
        <div>
          <button
            className="w-full flex items-center justify-center gap-2 py-3 rounded text-sm font-medium"
            style={{
              background: 'var(--sapButton_Background)',
              color: 'var(--sapButton_TextColor)',
              border: '1px solid var(--sapButton_BorderColor)',
            }}
          >
            <Camera size={16} />
            Capture Photo
          </button>
        </div>
      </div>

      {/* Footer Actions */}
      <div className="flex gap-2 p-4 border-t" style={{ 
        background: 'var(--sapShellColor)',
        borderColor: 'var(--sapList_BorderColor)',
      }}>
        <button
          onClick={removeDimension}
          disabled={dimensions.length <= 1}
          className="flex-1 py-3 rounded text-sm font-medium disabled:opacity-30"
          style={{
            background: 'var(--sapButton_Reject_Background)',
            color: 'var(--sapButton_Reject_TextColor)',
            border: '1px solid var(--sapButton_Reject_BorderColor)',
          }}
        >
          Delete
        </button>
        <button
          onClick={addDimension}
          className="flex-1 py-3 rounded text-sm font-medium"
          style={{
            background: 'var(--sapButton_Emphasized_Background)',
            color: 'var(--sapButton_Emphasized_TextColor)',
          }}
        >
          Add New
        </button>
      </div>
    </div>
  );
}
