/**
 * Part 22 — Project 360 Control Tower Component
 * 
 * The single screen that answers "how is this project doing?"
 * Displays 10 comprehensive sections with health score and drill-down.
 */

import React, { useState, useEffect } from 'react';
import { Project360Payload, Project360Section, HealthScore } from '../../platform/dashboard/role-dashboard-types';
import { project360Service } from '../../platform/dashboard/project-360-service';
import { Actor } from '../../platform/permission/actor';
import { HealthScoreGauge } from './HealthScoreGauge';
import { Project360SectionComponent } from './Project360Section';

interface Project360Props {
  projectId: number;
  actor: Actor;
}

export const Project360: React.FC<Project360Props> = ({ projectId, actor }) => {
  const [payload, setPayload] = useState<Project360Payload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['execution', 'finance']));

  useEffect(() => {
    loadProject360();
  }, [projectId, actor]);

  const loadProject360 = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await project360Service.getProject360(projectId, actor);
      setPayload(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load Project 360');
    } finally {
      setLoading(false);
    }
  };

  const toggleSection = (sectionType: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(sectionType)) {
      newExpanded.delete(sectionType);
    } else {
      newExpanded.add(sectionType);
    }
    setExpandedSections(newExpanded);
  };

  if (loading) {
    return (
      <div className="project-360 loading">
        <div className="loading-spinner">Loading Project 360...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="project-360 error">
        <div className="error-message">{error}</div>
        <button onClick={loadProject360}>Retry</button>
      </div>
    );
  }

  if (!payload) {
    return (
      <div className="project-360 empty">
        <div className="empty-message">No data available</div>
      </div>
    );
  }

  const { header, healthScore, sections } = payload;

  return (
    <div className="project-360">
      {/* Header Band */}
      <div className="project-360-header">
        <div className="header-main">
          <div className="project-identity">
            <span className="project-code">{header.code}</span>
            <h1 className="project-name">{header.name}</h1>
          </div>
          <div className="project-meta">
            <div className="meta-item">
              <span className="meta-label">Client:</span>
              <span className="meta-value">{header.client}</span>
            </div>
            <div className="meta-item">
              <span className="meta-label">Location:</span>
              <span className="meta-value">{header.location}</span>
            </div>
            <div className="meta-item">
              <span className="meta-label">Type:</span>
              <span className="meta-value">{header.projectType}</span>
            </div>
            <div className="meta-item">
              <span className="meta-label">Project Manager:</span>
              <span className="meta-value">{header.projectManager}</span>
            </div>
          </div>
          <div className="project-dates">
            <div className="date-range">
              <span className="date-label">Start:</span>
              <span className="date-value">{new Date(header.startDate).toLocaleDateString('en-GB')}</span>
            </div>
            <div className="date-range">
              <span className="date-label">End:</span>
              <span className="date-value">{new Date(header.endDate).toLocaleDateString('en-GB')}</span>
            </div>
            <div className="date-progress">
              <span className="progress-label">Progress:</span>
              <span className="progress-value">{header.daysElapsed} / {header.daysElapsed + header.daysRemaining} days</span>
              <div className="progress-bar">
                <div
                  className="progress-fill"
                  style={{ width: `${(header.daysElapsed / (header.daysElapsed + header.daysRemaining)) * 100}%` }}
                />
              </div>
            </div>
          </div>
          <div className="project-values">
            <div className="value-item">
              <span className="value-label">Contract Value:</span>
              <span className="value-amount">₹{(header.contractValue / 10000000).toFixed(2)} Cr</span>
            </div>
            <div className="value-item">
              <span className="value-label">Revised Value:</span>
              <span className="value-amount">₹{(header.revisedValue / 10000000).toFixed(2)} Cr</span>
            </div>
            <div className="value-item">
              <span className="value-label">Executed:</span>
              <span className="value-amount">₹{(header.revisedValue * 0.5 / 10000000).toFixed(2)} Cr</span>
            </div>
          </div>
          <div className="project-status">
            <span className={`status-chip status-${header.overallStatus.toLowerCase()}`}>
              {header.overallStatus.replace('_', ' ')}
            </span>
          </div>
        </div>

        {/* Health Score Gauge */}
        <div className="health-score-container">
          <HealthScoreGauge healthScore={healthScore} />
        </div>
      </div>

      {/* Sections */}
      <div className="project-360-sections">
        {sections.map((section) => (
          <Project360SectionComponent
            key={section.type}
            section={section}
            isExpanded={expandedSections.has(section.type)}
            onToggle={() => toggleSection(section.type)}
            projectId={projectId}
          />
        ))}
      </div>
    </div>
  );
};

export default Project360;
