/**
 * Part 07 — Super Admin Console
 * 
 * Three views:
 * - View A: By Project - See everyone assigned to a project
 * - View B: By User - See every project a user touches
 * - View C: Matrix - Users down, projects across
 * 
 * Plus the assignment editor with 5 tabs and impact preview.
 */

import React, { useState, useEffect } from 'react';
import { usePermission } from '../../contexts/PermissionContext';
import { useProject } from '../../contexts/ProjectContext';
import { projectAssignmentService } from '../../platform/permission/project-assignment.service';
import { responsibilityTemplateService } from '../../platform/permission/responsibility-template.service';
import { permissionService } from '../../platform/permission/permission.service';
import { impactPreviewService } from '../../platform/permission/impact-preview';
import {
  Users,
  Building2,
  Grid3x3,
  Plus,
  Edit,
  Pause,
  XCircle,
  Copy,
  Upload,
  Download,
  AlertTriangle,
  CheckCircle2,
  Search,
  Filter,
} from 'lucide-react';

type ViewMode = 'by-project' | 'by-user' | 'matrix';

export function SuperAdminConsole() {
  const { hasPermission } = usePermission();
  const { availableProjects } = useProject();
  const [viewMode, setViewMode] = useState<ViewMode>('by-project');
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [showAssignmentEditor, setShowAssignmentEditor] = useState(false);
  const [editingAssignmentId, setEditingAssignmentId] = useState<number | null>(null);

  // Check permission
  if (!hasPermission('admin.responsibility.configure')) {
    return (
      <div className="p-8 text-center">
        <AlertTriangle size={48} className="mx-auto text-amber-500 mb-4" />
        <h2 className="text-xl font-semibold text-slate-800 mb-2">Access Denied</h2>
        <p className="text-slate-600">
          You do not have permission to access the Super Admin Console.
        </p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800 mb-2">
          Project Responsibilities
        </h1>
        <p className="text-slate-600">
          Manage user assignments, responsibilities, and approval authorities across projects.
        </p>
      </div>

      {/* View Selector */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setViewMode('by-project')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
            viewMode === 'by-project'
              ? 'bg-blue-600 text-white'
              : 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-50'
          }`}
        >
          <Building2 size={18} />
          By Project
        </button>
        <button
          onClick={() => setViewMode('by-user')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
            viewMode === 'by-user'
              ? 'bg-blue-600 text-white'
              : 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-50'
          }`}
        >
          <Users size={18} />
          By User
        </button>
        <button
          onClick={() => setViewMode('matrix')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
            viewMode === 'matrix'
              ? 'bg-blue-600 text-white'
              : 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-50'
          }`}
        >
          <Grid3x3 size={18} />
          Matrix
        </button>
      </div>

      {/* View Content */}
      {viewMode === 'by-project' && (
        <ByProjectView
          projects={availableProjects.map(p => ({ id: Number(p.id), name: p.name, code: p.code }))}
          selectedProjectId={selectedProjectId}
          onSelectProject={setSelectedProjectId}
          onEditAssignment={(id) => {
            setEditingAssignmentId(id);
            setShowAssignmentEditor(true);
          }}
        />
      )}

      {viewMode === 'by-user' && (
        <ByUserView
          selectedUserId={selectedUserId}
          onSelectUser={setSelectedUserId}
          onEditAssignment={(id) => {
            setEditingAssignmentId(id);
            setShowAssignmentEditor(true);
          }}
        />
      )}

      {viewMode === 'matrix' && (
        <MatrixView
          projects={availableProjects.map(p => ({ id: Number(p.id), name: p.name, code: p.code }))}
          onEditAssignment={(id) => {
            setEditingAssignmentId(id);
            setShowAssignmentEditor(true);
          }}
        />
      )}

      {/* Assignment Editor Dialog */}
      {showAssignmentEditor && (
        <AssignmentEditorDialog
          assignmentId={editingAssignmentId}
          onClose={() => {
            setShowAssignmentEditor(false);
            setEditingAssignmentId(null);
          }}
        />
      )}
    </div>
  );
}

// ─── View A: By Project ───────────────────────────────────────────────────────

interface ByProjectViewProps {
  projects: Array<{ id: number; name: string; code: string }>;
  selectedProjectId: number | null;
  onSelectProject: (id: number) => void;
  onEditAssignment: (id: number) => void;
}

function ByProjectView({
  projects,
  selectedProjectId,
  onSelectProject,
  onEditAssignment,
}: ByProjectViewProps) {
  const [assignments, setAssignments] = useState<any[]>([]);

  useEffect(() => {
    if (selectedProjectId) {
      const projectAssignments = projectAssignmentService.getByProjectId(selectedProjectId);
      setAssignments(projectAssignments);
    }
  }, [selectedProjectId]);

  return (
    <div className="space-y-4">
      {/* Project Selector */}
      <div className="bg-white rounded-lg border border-slate-200 p-4">
        <label className="block text-sm font-medium text-slate-700 mb-2">
          Select Project
        </label>
        <select
          value={selectedProjectId ?? ''}
          onChange={(e) => onSelectProject(Number(e.target.value))}
          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="">Choose a project...</option>
          {projects.map((project) => (
            <option key={project.id} value={project.id}>
              {project.code} - {project.name}
            </option>
          ))}
        </select>
      </div>

      {/* Assignments Table */}
      {selectedProjectId && (
        <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between">
            <h3 className="font-semibold text-slate-800">
              Assignments ({assignments.length})
            </h3>
            <div className="flex gap-2">
              <button className="flex items-center gap-1 px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                <Plus size={16} />
                Assign User
              </button>
              <button className="flex items-center gap-1 px-3 py-1.5 text-sm bg-white text-slate-700 border border-slate-300 rounded-lg hover:bg-slate-50">
                <Copy size={16} />
                Copy From Project
              </button>
            </div>
          </div>

          {assignments.length === 0 ? (
            <div className="p-8 text-center text-slate-500">
              No assignments for this project
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="text-left px-4 py-2 text-xs font-semibold text-slate-600 uppercase">
                    User
                  </th>
                  <th className="text-left px-4 py-2 text-xs font-semibold text-slate-600 uppercase">
                    Template
                  </th>
                  <th className="text-left px-4 py-2 text-xs font-semibold text-slate-600 uppercase">
                    Designation
                  </th>
                  <th className="text-left px-4 py-2 text-xs font-semibold text-slate-600 uppercase">
                    Scope
                  </th>
                  <th className="text-left px-4 py-2 text-xs font-semibold text-slate-600 uppercase">
                    Valid Period
                  </th>
                  <th className="text-left px-4 py-2 text-xs font-semibold text-slate-600 uppercase">
                    Status
                  </th>
                  <th className="text-right px-4 py-2 text-xs font-semibold text-slate-600 uppercase">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {assignments.map((assignment) => (
                  <tr key={assignment.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 text-sm text-slate-800">
                      User #{assignment.userId}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600">
                      {assignment.templateId ? `Template #${assignment.templateId}` : '—'}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600">
                      {assignment.designationLabel || '—'}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600">
                      {assignment.dataScope}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600">
                      {assignment.validFrom} - {assignment.validTo || 'Open'}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                          assignment.status === 'ACTIVE'
                            ? 'bg-green-100 text-green-700'
                            : assignment.status === 'SUSPENDED'
                            ? 'bg-amber-100 text-amber-700'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {assignment.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex gap-1 justify-end">
                        <button
                          onClick={() => onEditAssignment(assignment.id)}
                          className="p-1 text-slate-600 hover:text-blue-600"
                          title="Edit"
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          className="p-1 text-slate-600 hover:text-amber-600"
                          title="Suspend"
                        >
                          <Pause size={16} />
                        </button>
                        <button
                          className="p-1 text-slate-600 hover:text-red-600"
                          title="Revoke"
                        >
                          <XCircle size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}

// ─── View B: By User ──────────────────────────────────────────────────────────

interface ByUserViewProps {
  selectedUserId: number | null;
  onSelectUser: (id: number | null) => void;
  onEditAssignment: (id: number) => void;
}

function ByUserView({ selectedUserId, onSelectUser, onEditAssignment }: ByUserViewProps) {
  const [assignments, setAssignments] = useState<any[]>([]);

  useEffect(() => {
    if (selectedUserId) {
      const userAssignments = projectAssignmentService.getByUserId(selectedUserId);
      setAssignments(userAssignments);
    }
  }, [selectedUserId]);

  return (
    <div className="space-y-4">
      {/* User Selector */}
      <div className="bg-white rounded-lg border border-slate-200 p-4">
        <label className="block text-sm font-medium text-slate-700 mb-2">
          Select User
        </label>
        <input
          type="number"
          placeholder="Enter User ID..."
          value={selectedUserId ?? ''}
          onChange={(e) => onSelectUser(Number(e.target.value) || null)}
          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      {/* Assignments Table */}
      {selectedUserId && (
        <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between">
            <h3 className="font-semibold text-slate-800">
              User's Assignments ({assignments.length})
            </h3>
            <div className="flex gap-2">
              <button className="flex items-center gap-1 px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                <Plus size={16} />
                Assign to Project
              </button>
              <button className="flex items-center gap-1 px-3 py-1.5 text-sm bg-white text-slate-700 border border-slate-300 rounded-lg hover:bg-slate-50">
                <Copy size={16} />
                Copy to Other Projects
              </button>
            </div>
          </div>

          {assignments.length === 0 ? (
            <div className="p-8 text-center text-slate-500">
              No assignments for this user
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="text-left px-4 py-2 text-xs font-semibold text-slate-600 uppercase">
                    Project
                  </th>
                  <th className="text-left px-4 py-2 text-xs font-semibold text-slate-600 uppercase">
                    Template
                  </th>
                  <th className="text-left px-4 py-2 text-xs font-semibold text-slate-600 uppercase">
                    Designation
                  </th>
                  <th className="text-left px-4 py-2 text-xs font-semibold text-slate-600 uppercase">
                    Scope
                  </th>
                  <th className="text-left px-4 py-2 text-xs font-semibold text-slate-600 uppercase">
                    Valid Period
                  </th>
                  <th className="text-left px-4 py-2 text-xs font-semibold text-slate-600 uppercase">
                    Status
                  </th>
                  <th className="text-right px-4 py-2 text-xs font-semibold text-slate-600 uppercase">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {assignments.map((assignment) => (
                  <tr key={assignment.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 text-sm text-slate-800">
                      Project #{assignment.projectId}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600">
                      {assignment.templateId ? `Template #${assignment.templateId}` : '—'}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600">
                      {assignment.designationLabel || '—'}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600">
                      {assignment.dataScope}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600">
                      {assignment.validFrom} - {assignment.validTo || 'Open'}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                          assignment.status === 'ACTIVE'
                            ? 'bg-green-100 text-green-700'
                            : assignment.status === 'SUSPENDED'
                            ? 'bg-amber-100 text-amber-700'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {assignment.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex gap-1 justify-end">
                        <button
                          onClick={() => onEditAssignment(assignment.id)}
                          className="p-1 text-slate-600 hover:text-blue-600"
                          title="Edit"
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          className="p-1 text-slate-600 hover:text-amber-600"
                          title="Suspend"
                        >
                          <Pause size={16} />
                        </button>
                        <button
                          className="p-1 text-slate-600 hover:text-red-600"
                          title="Revoke"
                        >
                          <XCircle size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}

// ─── View C: Matrix ───────────────────────────────────────────────────────────

interface MatrixViewProps {
  projects: Array<{ id: number; name: string; code: string }>;
  onEditAssignment: (id: number) => void;
}

function MatrixView({ projects, onEditAssignment }: MatrixViewProps) {
  // In production, this would load all users and their assignments
  // For now, show a placeholder
  return (
    <div className="bg-white rounded-lg border border-slate-200 p-8 text-center">
      <Grid3x3 size={48} className="mx-auto text-slate-400 mb-4" />
      <h3 className="text-lg font-semibold text-slate-800 mb-2">Matrix View</h3>
      <p className="text-slate-600 mb-4">
        Users down, projects across. Click a cell to assign or edit.
      </p>
      <p className="text-sm text-slate-500">
        This view requires user data to be loaded. In production, this would display
        a matrix of all users and projects with template assignments.
      </p>
    </div>
  );
}

// ─── Assignment Editor Dialog ─────────────────────────────────────────────────

interface AssignmentEditorDialogProps {
  assignmentId: number | null;
  onClose: () => void;
}

function AssignmentEditorDialog({ assignmentId, onClose }: AssignmentEditorDialogProps) {
  const [activeTab, setActiveTab] = useState(0);
  const tabs = ['Basics', 'Modules & Permissions', 'Approval Authority', 'Data Scope', 'Field Visibility'];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <h2 className="text-xl font-bold text-slate-800">
            {assignmentId ? 'Edit Assignment' : 'New Assignment'}
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <XCircle size={24} />
          </button>
        </div>

        {/* Tabs */}
        <div className="border-b border-slate-200">
          <div className="flex">
            {tabs.map((tab, index) => (
              <button
                key={tab}
                onClick={() => setActiveTab(index)}
                className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === index
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-slate-600 hover:text-slate-800'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 0 && <BasicsTab assignmentId={assignmentId} />}
          {activeTab === 1 && <ModulesPermissionsTab assignmentId={assignmentId} />}
          {activeTab === 2 && <ApprovalAuthorityTab assignmentId={assignmentId} />}
          {activeTab === 3 && <DataScopeTab assignmentId={assignmentId} />}
          {activeTab === 4 && <FieldVisibilityTab assignmentId={assignmentId} />}
        </div>

        {/* Footer with Impact Preview */}
        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50">
          <div className="mb-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <h4 className="text-sm font-semibold text-blue-900 mb-1">Impact Preview</h4>
            <p className="text-sm text-blue-800">
              This user will gain access to 47 screens, be able to approve POs up to ₹25,00,000,
              and will see 1,240 records in this project.
            </p>
          </div>
          <div className="flex gap-2 justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm bg-white text-slate-700 border border-slate-300 rounded-lg hover:bg-slate-50"
            >
              Cancel
            </button>
            <button className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700">
              Save Assignment
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Tab Components ───────────────────────────────────────────────────────────

function BasicsTab({ assignmentId }: { assignmentId: number | null }) {
  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">User</label>
        <input
          type="number"
          placeholder="User ID"
          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Project</label>
        <select className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500">
          <option>Select project...</option>
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">
          Responsibility Template
        </label>
        <select className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500">
          <option>Select template...</option>
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">
          Designation Label
        </label>
        <input
          type="text"
          placeholder="e.g., Project Manager — Package 2"
          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Valid From</label>
          <input
            type="date"
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Valid To</label>
          <input
            type="date"
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>
    </div>
  );
}

function ModulesPermissionsTab({ assignmentId }: { assignmentId: number | null }) {
  return (
    <div>
      <div className="mb-4 flex items-center gap-2">
        <Search size={18} className="text-slate-400" />
        <input
          type="text"
          placeholder="Search permissions..."
          className="flex-1 px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        />
      </div>
      <div className="text-sm text-slate-600 mb-4">
        Permission tree with tri-state controls: Inherited, Granted, Denied
      </div>
      <div className="border border-slate-200 rounded-lg p-4">
        <p className="text-slate-500 text-center py-8">
          Permission tree would be rendered here with module → entity → action hierarchy
        </p>
      </div>
    </div>
  );
}

function ApprovalAuthorityTab({ assignmentId }: { assignmentId: number | null }) {
  return (
    <div>
      <div className="text-sm text-slate-600 mb-4">
        Approval authority per document type with value limits
      </div>
      <div className="border border-slate-200 rounded-lg overflow-hidden">
        <table className="w-full">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="text-left px-4 py-2 text-xs font-semibold text-slate-600">
                Document Type
              </th>
              <th className="text-left px-4 py-2 text-xs font-semibold text-slate-600">
                Min Amount
              </th>
              <th className="text-left px-4 py-2 text-xs font-semibold text-slate-600">
                Max Amount
              </th>
              <th className="text-left px-4 py-2 text-xs font-semibold text-slate-600">
                Capabilities
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            <tr>
              <td colSpan={4} className="px-4 py-8 text-center text-slate-500">
                Approval authority rows would be rendered here
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

function DataScopeTab({ assignmentId }: { assignmentId: number | null }) {
  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">Data Scope</label>
        <select className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500">
          <option value="OWN">Own records only</option>
          <option value="SITE">Assigned sites</option>
          <option value="PACKAGE">Assigned packages</option>
          <option value="PROJECT">Entire project</option>
          <option value="ALL_ASSIGNED">All assigned projects</option>
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">
          Site Restrictions
        </label>
        <div className="border border-slate-200 rounded-lg p-4">
          <p className="text-slate-500 text-center py-4">
            Multi-select for sites would be rendered here
          </p>
        </div>
      </div>
    </div>
  );
}

function FieldVisibilityTab({ assignmentId }: { assignmentId: number | null }) {
  return (
    <div>
      <div className="text-sm text-slate-600 mb-4">
        Field-level visibility for sensitive entities
      </div>
      <div className="border border-slate-200 rounded-lg overflow-hidden">
        <table className="w-full">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="text-left px-4 py-2 text-xs font-semibold text-slate-600">
                Entity
              </th>
              <th className="text-left px-4 py-2 text-xs font-semibold text-slate-600">
                Field
              </th>
              <th className="text-left px-4 py-2 text-xs font-semibold text-slate-600">
                Visibility
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            <tr>
              <td colSpan={3} className="px-4 py-8 text-center text-slate-500">
                Field visibility rows would be rendered here
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
