/**
 * Part 17 — MB Workbench Component
 * Three-pane workbench for measurement book entry and management
 */

import React, { useState, useEffect } from 'react';
import { 
  Plus, Save, CheckCircle, AlertTriangle, Eye, Edit2, 
  Camera, FileText, Lock, Unlock, Download, Printer
} from 'lucide-react';
import { measurementBooks, mbLines, mbDimensions } from '../data/measurementData';
import { DimensionCalculator, applyRounding } from '../utils/dimensionCalculator';
import type { MeasurementBook, MbLine, MbDimension, FormulaCode } from '../types/measurement';
import { formatCurrency, formatDate } from '../utils/formatting';

export function MbWorkbench() {
  const [selectedMb, setSelectedMb] = useState<MeasurementBook | null>(null);
  const [selectedLine, setSelectedLine] = useState<MbLine | null>(null);
  const [dimensions, setDimensions] = useState<MbDimension[]>([]);
  const [computedQty, setComputedQty] = useState<number>(0);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    if (selectedLine) {
      const lineDimensions = mbDimensions.filter(d => d.mbLineId === selectedLine.id);
      setDimensions(lineDimensions);
      
      // Compute total quantity from dimensions
      const totalQty = lineDimensions.reduce((sum, dim) => {
        const inputs = extractInputs(dim);
        const result = DimensionCalculator.computeQuantity(dim.formulaCode, inputs);
        return sum + (dim.dimType === 'ADD' ? result.quantity : -result.quantity);
      }, 0);
      
      setComputedQty(applyRounding(totalQty, selectedLine.uom));
    }
  }, [selectedLine]);

  const extractInputs = (dim: MbDimension): Record<string, number | number[]> => {
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
    return inputs;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'DRAFT': return 'var(--sapNeutralColor)';
      case 'MEASURED': return 'var(--sapInformativeColor)';
      case 'CHECKED': return 'var(--sapCriticalColor)';
      case 'CERTIFIED': return 'var(--sapPositiveColor)';
      case 'DISPUTED': return 'var(--sapNegativeColor)';
      default: return 'var(--sapContent_LabelColor)';
    }
  };

  return (
    <div className="flex gap-4 h-[calc(100vh-12rem)]">
      {/* Left Pane - MB List */}
      <div className="w-80 sap-card overflow-auto">
        <div className="p-4 border-b" style={{ borderColor: 'var(--sapList_BorderColor)' }}>
          <h3 className="text-sm font-semibold" style={{ color: 'var(--sapTextColor)' }}>
            Measurement Books
          </h3>
        </div>
        <div className="divide-y" style={{ borderColor: 'var(--sapList_BorderColor)' }}>
          {measurementBooks.map(mb => (
            <div
              key={mb.id}
              className={`p-3 cursor-pointer hover:bg-[var(--sapList_Hover_Background)] ${
                selectedMb?.id === mb.id ? 'bg-[var(--sapList_SelectionBackgroundColor)]' : ''
              }`}
              onClick={() => setSelectedMb(mb)}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-semibold" style={{ color: 'var(--sapTextColor)' }}>
                  {mb.mbNo}
                </span>
                <span
                  className="text-xs px-2 py-0.5 rounded"
                  style={{
                    background: `${getStatusColor(mb.status)}20`,
                    color: getStatusColor(mb.status),
                  }}
                >
                  {mb.status}
                </span>
              </div>
              <div className="text-xs" style={{ color: 'var(--sapContent_LabelColor)' }}>
                {mb.measurementContext} • {mb.mbType}
              </div>
              <div className="text-xs mt-1" style={{ color: 'var(--sapContent_LabelColor)' }}>
                {formatDate(mb.measurementDate)}
              </div>
              <div className="text-sm font-semibold mt-1" style={{ color: 'var(--sapTextColor)' }}>
                {formatCurrency(mb.totalValue)}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Middle Pane - Line Grid */}
      <div className="flex-1 sap-card overflow-auto">
        {selectedMb ? (
          <>
            <div className="p-4 border-b flex items-center justify-between" style={{ borderColor: 'var(--sapList_BorderColor)' }}>
              <div>
                <h3 className="text-lg font-semibold" style={{ color: 'var(--sapTextColor)' }}>
                  {selectedMb.mbNo}
                </h3>
                <p className="text-xs" style={{ color: 'var(--sapContent_LabelColor)' }}>
                  {selectedMb.measurementContext} • {selectedMb.mbType} • {formatDate(selectedMb.measurementDate)}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {selectedMb.status === 'CERTIFIED' && (
                  <div className="flex items-center gap-1 px-2 py-1 rounded" style={{ background: 'var(--sapSuccessBackground)' }}>
                    <Lock size={14} style={{ color: 'var(--sapPositiveColor)' }} />
                    <span className="text-xs" style={{ color: 'var(--sapPositiveTextColor)' }}>Locked</span>
                  </div>
                )}
                <button className="p-2 rounded hover:bg-[var(--sapButton_Hover_Background)]">
                  <Printer size={16} />
                </button>
                <button className="p-2 rounded hover:bg-[var(--sapButton_Hover_Background)]">
                  <Download size={16} />
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead style={{ background: 'var(--sapList_HeaderBackground)' }}>
                  <tr>
                    <th className="text-left px-4 py-2 text-xs font-semibold" style={{ color: 'var(--sapList_HeaderTextColor)' }}>Line</th>
                    <th className="text-left px-4 py-2 text-xs font-semibold" style={{ color: 'var(--sapList_HeaderTextColor)' }}>BOQ Item</th>
                    <th className="text-left px-4 py-2 text-xs font-semibold" style={{ color: 'var(--sapList_HeaderTextColor)' }}>Description</th>
                    <th className="text-right px-4 py-2 text-xs font-semibold" style={{ color: 'var(--sapList_HeaderTextColor)' }}>Previous</th>
                    <th className="text-right px-4 py-2 text-xs font-semibold" style={{ color: 'var(--sapList_HeaderTextColor)' }}>Current</th>
                    <th className="text-right px-4 py-2 text-xs font-semibold" style={{ color: 'var(--sapList_HeaderTextColor)' }}>Cumulative</th>
                    <th className="text-right px-4 py-2 text-xs font-semibold" style={{ color: 'var(--sapList_HeaderTextColor)' }}>Rate</th>
                    <th className="text-right px-4 py-2 text-xs font-semibold" style={{ color: 'var(--sapList_HeaderTextColor)' }}>Amount</th>
                    <th className="text-center px-4 py-2 text-xs font-semibold" style={{ color: 'var(--sapList_HeaderTextColor)' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {mbLines.filter(l => l.mbId === selectedMb.id).map((line, idx) => (
                    <tr
                      key={line.id}
                      className={`cursor-pointer hover:bg-[var(--sapList_Hover_Background)] ${
                        selectedLine?.id === line.id ? 'bg-[var(--sapList_SelectionBackgroundColor)]' : ''
                      }`}
                      style={{ borderBottom: '1px solid var(--sapList_BorderColor)' }}
                      onClick={() => setSelectedLine(line)}
                    >
                      <td className="px-4 py-2 text-sm" style={{ color: 'var(--sapTextColor)' }}>
                        {line.lineNo}
                      </td>
                      <td className="px-4 py-2 text-sm font-mono" style={{ color: 'var(--sapTextColor)' }}>
                        {line.boqItemCode}
                      </td>
                      <td className="px-4 py-2 text-sm" style={{ color: 'var(--sapTextColor)' }}>
                        <div className="truncate max-w-xs">{line.description}</div>
                      </td>
                      <td className="px-4 py-2 text-sm text-right" style={{ color: 'var(--sapContent_LabelColor)' }}>
                        {line.previousQty}
                      </td>
                      <td className="px-4 py-2 text-sm text-right font-semibold" style={{ color: 'var(--sapTextColor)' }}>
                        {line.netQty}
                      </td>
                      <td className="px-4 py-2 text-sm text-right" style={{ color: 'var(--sapTextColor)' }}>
                        {line.cumulativeQty}
                      </td>
                      <td className="px-4 py-2 text-sm text-right" style={{ color: 'var(--sapTextColor)' }}>
                        {formatCurrency(line.rate)}
                      </td>
                      <td className="px-4 py-2 text-sm text-right font-semibold" style={{ color: 'var(--sapTextColor)' }}>
                        {formatCurrency(line.amount)}
                      </td>
                      <td className="px-4 py-2 text-center">
                        {line.isDisputed && (
                          <AlertTriangle size={14} style={{ color: 'var(--sapNegativeColor)' }} />
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot style={{ background: 'var(--sapList_HeaderBackground)' }}>
                  <tr>
                    <td colSpan={7} className="px-4 py-2 text-sm font-semibold text-right" style={{ color: 'var(--sapTextColor)' }}>
                      Total:
                    </td>
                    <td className="px-4 py-2 text-sm font-bold text-right" style={{ color: 'var(--sapTextColor)' }}>
                      {formatCurrency(selectedMb.totalValue)}
                    </td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </>
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <FileText size={48} className="mx-auto mb-4" style={{ color: 'var(--sapContent_NonInteractiveIconColor)' }} />
              <p className="text-sm" style={{ color: 'var(--sapContent_LabelColor)' }}>
                Select a measurement book to view details
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Right Pane - Dimension Detail */}
      {selectedLine && (
        <div className="w-96 sap-card overflow-auto">
          <div className="p-4 border-b" style={{ borderColor: 'var(--sapList_BorderColor)' }}>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold" style={{ color: 'var(--sapTextColor)' }}>
                Line {selectedLine.lineNo} - Dimensions
              </h3>
              {selectedMb?.status !== 'CERTIFIED' && (
                <button
                  onClick={() => setIsEditing(!isEditing)}
                  className="p-1 rounded hover:bg-[var(--sapButton_Hover_Background)]"
                >
                  {isEditing ? <Lock size={14} /> : <Edit2 size={14} />}
                </button>
              )}
            </div>
            <div className="text-xs" style={{ color: 'var(--sapContent_LabelColor)' }}>
              {selectedLine.boqItemCode} - {selectedLine.description}
            </div>
          </div>

          <div className="p-4 space-y-4">
            {/* Computed Quantity */}
            <div className="p-3 rounded" style={{ background: 'var(--sapInformationBackground)' }}>
              <div className="text-xs mb-1" style={{ color: 'var(--sapInformativeTextColor)' }}>
                Computed Quantity
              </div>
              <div className="text-2xl font-bold" style={{ color: 'var(--sapInformativeTextColor)' }}>
                {computedQty} {selectedLine.uom}
              </div>
              <div className="text-xs mt-1" style={{ color: 'var(--sapInformativeTextColor)' }}>
                Formula: {selectedLine.measurementMethod}
              </div>
            </div>

            {/* BOQ Context */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-2 rounded" style={{ background: 'var(--sapList_Background)' }}>
                <div className="text-xs" style={{ color: 'var(--sapContent_LabelColor)' }}>BOQ Qty</div>
                <div className="text-sm font-semibold" style={{ color: 'var(--sapTextColor)' }}>
                  {selectedLine.boqQty}
                </div>
              </div>
              <div className="p-2 rounded" style={{ background: 'var(--sapList_Background)' }}>
                <div className="text-xs" style={{ color: 'var(--sapContent_LabelColor)' }}>Balance</div>
                <div className="text-sm font-semibold" style={{ color: 'var(--sapTextColor)' }}>
                  {selectedLine.balanceQty}
                </div>
              </div>
              <div className="p-2 rounded" style={{ background: 'var(--sapList_Background)' }}>
                <div className="text-xs" style={{ color: 'var(--sapContent_LabelColor)' }}>Previous</div>
                <div className="text-sm font-semibold" style={{ color: 'var(--sapTextColor)' }}>
                  {selectedLine.previousQty}
                </div>
              </div>
              <div className="p-2 rounded" style={{ background: 'var(--sapList_Background)' }}>
                <div className="text-xs" style={{ color: 'var(--sapContent_LabelColor)' }}>Cumulative</div>
                <div className="text-sm font-semibold" style={{ color: 'var(--sapTextColor)' }}>
                  {selectedLine.cumulativeQty}
                </div>
              </div>
            </div>

            {/* Dimensions */}
            <div>
              <h4 className="text-xs font-semibold mb-2" style={{ color: 'var(--sapTextColor)' }}>
                Dimension Details
              </h4>
              <div className="space-y-2">
                {dimensions.map(dim => (
                  <div key={dim.id} className="p-2 rounded border" style={{ borderColor: 'var(--sapList_BorderColor)' }}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-semibold" style={{ color: 'var(--sapTextColor)' }}>
                        {dim.seqNo}. {dim.dimType}
                      </span>
                      <span className="text-xs font-mono" style={{ color: 'var(--sapContent_LabelColor)' }}>
                        {dim.formulaCode}
                      </span>
                    </div>
                    {dim.description && (
                      <div className="text-xs mb-1" style={{ color: 'var(--sapContent_LabelColor)' }}>
                        {dim.description}
                      </div>
                    )}
                    <div className="grid grid-cols-4 gap-1 text-xs">
                      {dim.nos !== undefined && (
                        <div>
                          <span style={{ color: 'var(--sapContent_LabelColor)' }}>Nos: </span>
                          <span style={{ color: 'var(--sapTextColor)' }}>{dim.nos}</span>
                        </div>
                      )}
                      {dim.length !== undefined && (
                        <div>
                          <span style={{ color: 'var(--sapContent_LabelColor)' }}>L: </span>
                          <span style={{ color: 'var(--sapTextColor)' }}>{dim.length}</span>
                        </div>
                      )}
                      {dim.breadth !== undefined && (
                        <div>
                          <span style={{ color: 'var(--sapContent_LabelColor)' }}>B: </span>
                          <span style={{ color: 'var(--sapTextColor)' }}>{dim.breadth}</span>
                        </div>
                      )}
                      {dim.height !== undefined && (
                        <div>
                          <span style={{ color: 'var(--sapContent_LabelColor)' }}>H: </span>
                          <span style={{ color: 'var(--sapTextColor)' }}>{dim.height}</span>
                        </div>
                      )}
                    </div>
                    <div className="text-xs mt-1 text-right font-semibold" style={{ color: 'var(--sapTextColor)' }}>
                      = {dim.computedQty}
                    </div>
                    {dim.remark && (
                      <div className="text-xs mt-1 italic" style={{ color: 'var(--sapContent_LabelColor)' }}>
                        {dim.remark}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Evidence */}
            <div>
              <h4 className="text-xs font-semibold mb-2" style={{ color: 'var(--sapTextColor)' }}>
                Evidence
              </h4>
              <div className="flex items-center gap-2">
                <button className="flex items-center gap-1 px-2 py-1 rounded text-xs" style={{
                  background: 'var(--sapButton_Background)',
                  color: 'var(--sapButton_TextColor)',
                  border: '1px solid var(--sapButton_BorderColor)',
                }}>
                  <Camera size={12} />
                  Photos
                </button>
                <button className="flex items-center gap-1 px-2 py-1 rounded text-xs" style={{
                  background: 'var(--sapButton_Background)',
                  color: 'var(--sapButton_TextColor)',
                  border: '1px solid var(--sapButton_BorderColor)',
                }}>
                  <FileText size={12} />
                  Sketches
                </button>
              </div>
            </div>

            {/* Hash Verification */}
            <div className="p-2 rounded" style={{ background: 'var(--sapNeutralBackground)' }}>
              <div className="text-xs font-semibold mb-1" style={{ color: 'var(--sapTextColor)' }}>
                Calc Hash
              </div>
              <div className="text-xs font-mono break-all" style={{ color: 'var(--sapContent_LabelColor)' }}>
                {selectedLine.calcHash}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
