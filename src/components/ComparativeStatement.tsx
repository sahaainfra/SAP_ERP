/**
 * Part 14 — Comparative Statement Component
 * The key procurement screen: item-wise vendor comparison with L1 highlighting
 */

import React, { useState } from 'react';
import { CheckCircle, Award, TrendingDown, MessageSquare } from 'lucide-react';
import { comparatives, comparativeRecommendations, vendorComparativeData, rfqs, quotations } from '../data/procurementData';
import type { Comparative, ComparativeRecommendation, VendorComparativeData } from '../types/procurement';
import { formatCurrency } from '../utils/formatting';

export function ComparativeStatement() {
  const [selectedComparative, setSelectedComparative] = useState<Comparative>(comparatives[0]);
  const [showNegotiationModal, setShowNegotiationModal] = useState(false);

  const rfq = rfqs.find(r => r.id === selectedComparative?.rfqId);

  const getRankColor = (rank: number) => {
    if (rank === 1) return 'var(--sapPositiveColor)';
    if (rank === 2) return 'var(--sapCriticalColor)';
    return 'var(--sapContent_LabelColor)';
  };

  const getRankBadge = (rank: number) => {
    if (rank === 1) return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-bold" style={{ background: 'var(--sapSuccessBackground)', color: 'var(--sapPositiveTextColor)' }}>
        <Award size={12} />
        L1
      </span>
    );
    if (rank === 2) return (
      <span className="px-2 py-0.5 rounded text-xs font-bold" style={{ background: 'var(--sapWarningBackground)', color: 'var(--sapCriticalTextColor)' }}>
        L2
      </span>
    );
    return (
      <span className="px-2 py-0.5 rounded text-xs" style={{ background: 'var(--sapNeutralBackground)', color: 'var(--sapNeutralTextColor)' }}>
        L{rank}
      </span>
    );
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold" style={{ color: 'var(--sapTextColor)' }}>
            Comparative Statement
          </h2>
          <p className="text-sm" style={{ color: 'var(--sapContent_LabelColor)' }}>
            {rfq?.rfqNo} — {rfq?.title}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {selectedComparative?.status === 'APPROVED' && (
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded text-sm font-medium" style={{ background: 'var(--sapSuccessBackground)', color: 'var(--sapPositiveTextColor)' }}>
              <CheckCircle size={16} />
              Approved
            </span>
          )}
          <button
            onClick={() => setShowNegotiationModal(true)}
            className="flex items-center gap-2 px-4 py-2 rounded text-sm font-medium"
            style={{
              background: 'var(--sapButton_Background)',
              color: 'var(--sapButton_TextColor)',
              border: '1px solid var(--sapButton_BorderColor)',
            }}
          >
            <MessageSquare size={16} />
            Negotiate
          </button>
          <button
            className="flex items-center gap-2 px-4 py-2 rounded text-sm font-medium"
            style={{
              background: 'var(--sapButton_Emphasized_Background)',
              color: 'var(--sapButton_Emphasized_TextColor)',
            }}
          >
            <CheckCircle size={16} />
            Approve CS
          </button>
        </div>
      </div>

      {/* RFQ Summary */}
      <div className="sap-card p-4">
        <div className="grid grid-cols-4 gap-4">
          <div>
            <div className="text-xs mb-1" style={{ color: 'var(--sapContent_LabelColor)' }}>
              RFQ Type
            </div>
            <div className="text-sm font-semibold" style={{ color: 'var(--sapTextColor)' }}>
              {rfq?.rfqType}
            </div>
          </div>
          <div>
            <div className="text-xs mb-1" style={{ color: 'var(--sapContent_LabelColor)' }}>
              Evaluation Basis
            </div>
            <div className="text-sm font-semibold" style={{ color: 'var(--sapTextColor)' }}>
              {selectedComparative?.evaluationBasis.replace('_', ' ')}
            </div>
          </div>
          <div>
            <div className="text-xs mb-1" style={{ color: 'var(--sapContent_LabelColor)' }}>
              Quotations Received
            </div>
            <div className="text-sm font-semibold" style={{ color: 'var(--sapTextColor)' }}>
              {vendorComparativeData.length}
            </div>
          </div>
          <div>
            <div className="text-xs mb-1" style={{ color: 'var(--sapContent_LabelColor)' }}>
              Negotiation Rounds
            </div>
            <div className="text-sm font-semibold" style={{ color: 'var(--sapTextColor)' }}>
              {selectedComparative?.negotiationRound}
            </div>
          </div>
        </div>
      </div>

      {/* Comparative Matrix */}
      <div className="sap-card overflow-x-auto">
        <table className="w-full">
          <thead style={{ background: 'var(--sapList_HeaderBackground)' }}>
            <tr>
              <th className="text-left px-4 py-3 text-xs font-semibold sticky left-0 z-10" style={{ color: 'var(--sapList_HeaderTextColor)', background: 'var(--sapList_HeaderBackground)', minWidth: '200px' }}>
                Item
              </th>
              {vendorComparativeData.map((vendor) => (
                <th key={vendor.vendorId} className="text-center px-4 py-3 text-xs font-semibold" style={{ color: 'var(--sapList_HeaderTextColor)', minWidth: '180px' }}>
                  <div className="flex flex-col items-center gap-1">
                    <span>{vendor.vendorName}</span>
                    <span className="text-xs font-normal" style={{ color: 'var(--sapContent_LabelColor)' }}>
                      Score: {vendor.vendorScorecard}
                    </span>
                  </div>
                </th>
              ))}
              <th className="text-left px-4 py-3 text-xs font-semibold" style={{ color: 'var(--sapList_HeaderTextColor)', minWidth: '150px' }}>
                Budget / Last Purchase
              </th>
            </tr>
          </thead>
          <tbody>
            {/* Item 1: TMT Bar 16mm */}
            <tr className="border-t" style={{ borderColor: 'var(--sapList_BorderColor)' }}>
              <td className="px-4 py-3 sticky left-0 z-10" style={{ background: 'var(--sapList_Background)' }}>
                <div className="text-sm font-medium" style={{ color: 'var(--sapTextColor)' }}>
                  TMT Bar 16mm
                </div>
                <div className="text-xs" style={{ color: 'var(--sapContent_LabelColor)' }}>
                  STL-16 • 10 MT
                </div>
              </td>
              {vendorComparativeData.map((vendor) => {
                const itemQuote = vendor.itemQuotes.find(q => q.rfqIndentMapId === 1);
                if (!itemQuote) return <td key={vendor.vendorId} className="px-4 py-3 text-center">—</td>;

                return (
                  <td key={vendor.vendorId} className="px-4 py-3 text-center">
                    <div className="flex flex-col items-center gap-1">
                      {getRankBadge(itemQuote.rank)}
                      <div className="text-sm font-bold" style={{ color: 'var(--sapTextColor)' }}>
                        {formatCurrency(itemQuote.landedRate)}/MT
                      </div>
                      <div className="text-xs" style={{ color: 'var(--sapContent_LabelColor)' }}>
                        Total: {formatCurrency(itemQuote.totalValue)}
                      </div>
                      {itemQuote.varianceVsBudget && (
                        <div className="text-xs flex items-center gap-1" style={{ color: itemQuote.varianceVsBudget < 0 ? 'var(--sapPositiveColor)' : 'var(--sapNegativeColor)' }}>
                          <TrendingDown size={10} />
                          {itemQuote.varianceVsBudget < 0 ? 'Saving' : 'Over'}: {formatCurrency(Math.abs(itemQuote.varianceVsBudget))}
                        </div>
                      )}
                    </div>
                  </td>
                );
              })}
              <td className="px-4 py-3">
                <div className="text-xs" style={{ color: 'var(--sapContent_LabelColor)' }}>
                  Budget: {formatCurrency(58000)}/MT
                </div>
                <div className="text-xs" style={{ color: 'var(--sapContent_LabelColor)' }}>
                  Last: {formatCurrency(56500)}/MT
                </div>
              </td>
            </tr>

            {/* Item 2: TMT Bar 20mm */}
            <tr className="border-t" style={{ borderColor: 'var(--sapList_BorderColor)' }}>
              <td className="px-4 py-3 sticky left-0 z-10" style={{ background: 'var(--sapList_Background)' }}>
                <div className="text-sm font-medium" style={{ color: 'var(--sapTextColor)' }}>
                  TMT Bar 20mm
                </div>
                <div className="text-xs" style={{ color: 'var(--sapContent_LabelColor)' }}>
                  STL-20 • 10 MT
                </div>
              </td>
              {vendorComparativeData.map((vendor) => {
                const itemQuote = vendor.itemQuotes.find(q => q.rfqIndentMapId === 2);
                if (!itemQuote) return <td key={vendor.vendorId} className="px-4 py-3 text-center">—</td>;

                return (
                  <td key={vendor.vendorId} className="px-4 py-3 text-center">
                    <div className="flex flex-col items-center gap-1">
                      {getRankBadge(itemQuote.rank)}
                      <div className="text-sm font-bold" style={{ color: 'var(--sapTextColor)' }}>
                        {formatCurrency(itemQuote.landedRate)}/MT
                      </div>
                      <div className="text-xs" style={{ color: 'var(--sapContent_LabelColor)' }}>
                        Total: {formatCurrency(itemQuote.totalValue)}
                      </div>
                      {itemQuote.varianceVsBudget && (
                        <div className="text-xs flex items-center gap-1" style={{ color: itemQuote.varianceVsBudget < 0 ? 'var(--sapPositiveColor)' : 'var(--sapNegativeColor)' }}>
                          <TrendingDown size={10} />
                          {itemQuote.varianceVsBudget < 0 ? 'Saving' : 'Over'}: {formatCurrency(Math.abs(itemQuote.varianceVsBudget))}
                        </div>
                      )}
                    </div>
                  </td>
                );
              })}
              <td className="px-4 py-3">
                <div className="text-xs" style={{ color: 'var(--sapContent_LabelColor)' }}>
                  Budget: {formatCurrency(58500)}/MT
                </div>
                <div className="text-xs" style={{ color: 'var(--sapContent_LabelColor)' }}>
                  Last: {formatCurrency(57000)}/MT
                </div>
              </td>
            </tr>

            {/* Total Row */}
            <tr className="border-t-2 font-semibold" style={{ borderColor: 'var(--sapList_BorderColor)', background: 'var(--sapList_HeaderBackground)' }}>
              <td className="px-4 py-3 sticky left-0 z-10" style={{ background: 'var(--sapList_HeaderBackground)' }}>
                <div className="text-sm" style={{ color: 'var(--sapTextColor)' }}>
                  TOTAL VALUE
                </div>
              </td>
              {vendorComparativeData.map((vendor) => {
                const isLowest = vendor.totalValue === Math.min(...vendorComparativeData.map(v => v.totalValue));
                return (
                  <td key={vendor.vendorId} className="px-4 py-3 text-center">
                    <div className="flex flex-col items-center gap-1">
                      {isLowest && getRankBadge(1)}
                      <div className="text-base font-bold" style={{ color: 'var(--sapTextColor)' }}>
                        {formatCurrency(vendor.totalValue)}
                      </div>
                      <div className="text-xs" style={{ color: 'var(--sapContent_LabelColor)' }}>
                        Delivery: {vendor.deliveryDays} days
                      </div>
                    </div>
                  </td>
                );
              })}
              <td className="px-4 py-3">
                <div className="text-xs" style={{ color: 'var(--sapContent_LabelColor)' }}>
                  Budget: {formatCurrency(1165000)}
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Recommendations */}
      <div className="sap-card p-4">
        <h3 className="text-sm font-semibold mb-3" style={{ color: 'var(--sapTextColor)' }}>
          Recommendations
        </h3>
        <div className="space-y-2">
          {comparativeRecommendations.map((rec) => (
            <div
              key={rec.id}
              className="flex items-center justify-between p-3 rounded border"
              style={{ borderColor: 'var(--sapList_BorderColor)' }}
            >
              <div className="flex items-center gap-3">
                {rec.isLowest ? (
                  <CheckCircle size={20} style={{ color: 'var(--sapPositiveColor)' }} />
                ) : (
                  <MessageSquare size={20} style={{ color: 'var(--sapCriticalColor)' }} />
                )}
                <div>
                  <div className="text-sm font-medium" style={{ color: 'var(--sapTextColor)' }}>
                    {rec.itemName} — {rec.recommendedVendorName}
                  </div>
                  <div className="text-xs" style={{ color: 'var(--sapContent_LabelColor)' }}>
                    {rec.recommendedQty} units @ {formatCurrency(rec.recommendedRate)}/unit
                  </div>
                  {!rec.isLowest && rec.deviationReason && (
                    <div className="text-xs mt-1 p-2 rounded" style={{ background: 'var(--sapWarningBackground)', color: 'var(--sapCriticalTextColor)' }}>
                      <strong>Deviation Reason:</strong> {rec.deviationReason}
                    </div>
                  )}
                </div>
              </div>
              <div className="text-right">
                {rec.savingVsBudget && (
                  <div className="text-xs" style={{ color: 'var(--sapPositiveColor)' }}>
                    Saving vs Budget: {formatCurrency(rec.savingVsBudget)}
                  </div>
                )}
                {rec.savingVsLastPurchase && (
                  <div className="text-xs" style={{ color: rec.savingVsLastPurchase > 0 ? 'var(--sapPositiveColor)' : 'var(--sapNegativeColor)' }}>
                    vs Last Purchase: {formatCurrency(rec.savingVsLastPurchase)}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Negotiation Modal */}
      {showNegotiationModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="sap-card max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-xl font-bold mb-4" style={{ color: 'var(--sapTextColor)' }}>
                Negotiation Round {selectedComparative?.negotiationRound ? selectedComparative.negotiationRound + 1 : 1}
              </h2>
              <div className="space-y-4">
                {vendorComparativeData.map((vendor) => (
                  <div key={vendor.vendorId} className="p-4 rounded border" style={{ borderColor: 'var(--sapList_BorderColor)' }}>
                    <h3 className="text-sm font-semibold mb-3" style={{ color: 'var(--sapTextColor)' }}>
                      {vendor.vendorName}
                    </h3>
                    <div className="space-y-2">
                      {vendor.itemQuotes.map((quote, idx) => (
                        <div key={idx} className="flex items-center justify-between">
                          <span className="text-sm" style={{ color: 'var(--sapTextColor)' }}>
                            {quote.itemName}
                          </span>
                          <div className="flex items-center gap-2">
                            <span className="text-sm" style={{ color: 'var(--sapContent_LabelColor)' }}>
                              Current: {formatCurrency(quote.landedRate)}
                            </span>
                            <input
                              type="number"
                              placeholder="Negotiated rate"
                              className="w-32 px-2 py-1 rounded border text-sm"
                              style={{
                                background: 'var(--sapField_Background)',
                                borderColor: 'var(--sapField_BorderColor)',
                                color: 'var(--sapField_TextColor)',
                              }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex items-center justify-end gap-2 mt-6">
                <button
                  onClick={() => setShowNegotiationModal(false)}
                  className="px-4 py-2 rounded text-sm font-medium"
                  style={{
                    background: 'var(--sapButton_Background)',
                    color: 'var(--sapButton_TextColor)',
                    border: '1px solid var(--sapButton_BorderColor)',
                  }}
                >
                  Cancel
                </button>
                <button
                  className="px-4 py-2 rounded text-sm font-medium"
                  style={{
                    background: 'var(--sapButton_Emphasized_Background)',
                    color: 'var(--sapButton_Emphasized_TextColor)',
                  }}
                >
                  Save Negotiation
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
