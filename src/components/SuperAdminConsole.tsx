/**
 * Super Admin Console - Part 3
 * 
 * Three views:
 * - View A: By Project - See all users assigned to a project
 * - View B: By User - See all projects a user is assigned to
 * - View C: Matrix - Users vs Projects grid
 */

import { useState } from 'react';
import { 
  Users, Building2, Grid3X3, Plus, Edit2, Trash2, 
  AlertTriangle, CheckCircle2, XCircle, Search, Filter
} from 'lucide-react';
import { 
  users, 
  projectAssignments, 
  responsibilityTemplates,
  sodRules 
} from '../data/permissionData';
import { projects } from '../data/mockData';
import type { ProjectAssignment, UserWithPermissions } from '../types/permissions';

type ViewMode = 'project' | 'user' | 'matrix';

export default function SuperAdminConsole() {
  const [viewMode, setViewMode] = useState<ViewMode>('project');
  const [selectedProjectId, setSelectedProjectId] = useState<string>('PRJ-001');
  const [selectedUserId, setSelectedUserId] = useState<number>(2);
  const [showAssignmentDialog, setShowAssignmentDialog] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState<ProjectAssignment | null>(null);

  const handleAssign = (assignment?: ProjectAssignment) => {
    setEditingAssignment(assignment || null);
    setShowAssignmentDialog(true);
  };

  return (
    <div className="min-h-screen bg-[var(--sapBackgroundColor)] p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[var(--sapTextColor)]">
          Project Responsibilities
        </h1>
        <p className="text-sm text-[var(--sapContentLabelColor)] mt-1">
          Manage user assignments, permissions, and approval authorities across projects
        </p>
      </div>

      {/* View Mode Selector */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setViewMode('project')}
          className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-colors ${
            viewMode === 'project'
              ? 'bg-[var(--sapBrandColor)] text-white'
              : 'bg-[var(--sapButtonBackground)] text-[var(--sapButtonTextColor)] hover:bg-[var(--sapButtonHoverBackground)]'
          }`}
        >
          <Building2 size={18} />
          By Project
        </button>
        <button
          onClick={() => setViewMode('user')}
          className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-colors ${
            viewMode === 'user'
              ? 'bg-[var(--sapBrandColor)] text-white'
              : 'bg-[var(--sapButtonBackground)] text-[var(--sapButtonTextColor)] hover:bg-[var(--sapButtonHoverBackground)]'
          }`}
        >
          <Users size={18} />
          By User
        </button>
        <button
          onClick={() => setViewMode('matrix')}
          className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-colors ${
            viewMode === 'matrix'
              ? 'bg-[var(--sapBrandColor)] text-white'
              : 'bg-[var(--sapButtonBackground)] text-[var(--sapButtonTextColor)] hover:bg-[var(--sapButtonHoverBackground)]'
          }`}
        >
          <Grid3X3 size={18} />
          Matrix View
        </button>
      </div>

      {/* View Content */}
      {viewMode === 'project' && (
        <ProjectView
          selectedProjectId={selectedProjectId}
          onProjectChange={(id: string) => setSelectedProjectId(id)}
          onAssign={handleAssign}
        />
      )}
      {viewMode === 'user' && (
        <UserView
          selectedUserId={selectedUserId}
          onUserChange={setSelectedUserId}
          onAssign={handleAssign}
        />
      )}
      {viewMode === 'matrix' && (
        <MatrixView onAssign={handleAssign} />
      )}

      {/* Assignment Dialog */}
      {showAssignmentDialog && (
        <AssignmentDialog
          assignment={editingAssignment}
          onClose={() => setShowAssignmentDialog(false)}
          onSave={() => {
            // In production, this would save to the backend
            setShowAssignmentDialog(false);
          }}
        />
      )}
    </div>
  );
}

// ─── View A: By Project ──────────────────────────────────────────────────────

function ProjectView({ 
  selectedProjectId, 
  onProjectChange, 
  onAssign 
}: { 
  selectedProjectId: string; 
  onProjectChange: (id: string) => void;
  onAssign: (assignment?: ProjectAssignment) => void;
}) {
  const project = projects.find(p => p.id === selectedProjectId);
  // Map project string ID to number for assignment lookup
  const projectNumId = projects.findIndex(p => p.id === selectedProjectId) + 1;
  const assignments = projectAssignments.filter(a => a.projectId === projectNumId);

  return (
    <div className="bg-[var(--sapGroupContentBackground)] rounded-lg shadow-sm">
      {/* Project Selector */}
      <div className="p-4 border-b border-[var(--sapGroupContentBorderColor)]">
        <div className="flex items-center justify-between">
          <div>
            <label className="text-sm font-medium text-[var(--sapTextColor)]">Select Project</label>
            <select
              value={selectedProjectId}
              onChange={(e) => onProjectChange(e.target.value)}
              className="ml-4 px-3 py-1.5 rounded border border-[var(--sapFieldBorderColor)] bg-[var(--sapFieldBackground)] text-[var(--sapFieldTextColor)]"
            >
              {projects.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
          <button
            onClick={() => onAssign()}
            className="px-4 py-2 rounded-lg bg-[var(--sapBrandColor)] text-white flex items-center gap-2 hover:opacity-90 transition-opacity"
          >
            <Plus size={18} />
            Assign User
          </button>
        </div>
      </div>

      {/* Assignments Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-[var(--sapListHeaderBackground)] border-b border-[var(--sapListBorderColor)]">
            <tr>
              <th className="text-left px-4 py-3 text-xs font-semibold text-[var(--sapListHeaderTextColor)]">User</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-[var(--sapListHeaderTextColor)]">Responsibility</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-[var(--sapListHeaderTextColor)]">Designation</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-[var(--sapListHeaderTextColor)]">Data Scope</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-[var(--sapListHeaderTextColor)]">Status</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-[var(--sapListHeaderTextColor)]">Valid From</th>
              <th className="text-right px-4 py-3 text-xs font-semibold text-[var(--sapListHeaderTextColor)]">Actions</th>
            </tr>
          </thead>
          <tbody>
            {assignments.map(assignment => {
              const user = users.find(u => u.id === assignment.userId);
              const template = responsibilityTemplates.find(t => t.id === assignment.templateId);
              
              return (
                <tr key={assignment.id} className="border-b border-[var(--sapListBorderColor)] hover:bg-[var(--sapListHoverBackground)]">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-[var(--sapAccentColor6)] flex items-center justify-center text-white text-sm font-medium">
                        {user?.fullName.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div>
                        <div className="text-sm font-medium text-[var(--sapListTextColor)]">{user?.fullName}</div>
                        <div className="text-xs text-[var(--sapContentLabelColor)]">{user?.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-sm text-[var(--sapListTextColor)]">{template?.templateName}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-sm text-[var(--sapListTextColor)]">{assignment.designationLabel}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs px-2 py-1 rounded bg-[var(--sapInformationBackground)] text-[var(--sapInformativeTextColor)]">
                      {assignment.dataScope}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-1 rounded ${
                      assignment.status === 'ACTIVE' 
                        ? 'bg-[var(--sapSuccessBackground)] text-[var(--sapPositiveTextColor)]'
                        : 'bg-[var(--sapErrorBackground)] text-[var(--sapNegativeTextColor)]'
                    }`}>
                      {assignment.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-sm text-[var(--sapListTextColor)]">
                      {new Date(assignment.validFrom).toLocaleDateString()}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => onAssign(assignment)}
                        className="p-1.5 rounded hover:bg-[var(--sapButtonHoverBackground)] text-[var(--sapButtonTextColor)]"
                        title="Edit"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        className="p-1.5 rounded hover:bg-[var(--sapButtonHoverBackground)] text-[var(--sapNegativeTextColor)]"
                        title="Revoke"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {assignments.length === 0 && (
        <div className="p-8 text-center text-[var(--sapContentLabelColor)]">
          No users assigned to this project
        </div>
      )}
    </div>
  );
}

// ─── View B: By User ─────────────────────────────────────────────────────────

function UserView({ 
  selectedUserId, 
  onUserChange, 
  onAssign 
}: { 
  selectedUserId: number; 
  onUserChange: (id: number) => void;
  onAssign: (assignment?: ProjectAssignment) => void;
}) {
  const user = users.find(u => u.id === selectedUserId);
  const assignments = projectAssignments.filter(a => a.userId === selectedUserId);

  return (
    <div className="bg-[var(--sapGroupContentBackground)] rounded-lg shadow-sm">
      {/* User Selector */}
      <div className="p-4 border-b border-[var(--sapGroupContentBorderColor)]">
        <div className="flex items-center justify-between">
          <div>
            <label className="text-sm font-medium text-[var(--sapTextColor)]">Select User</label>
            <select
              value={selectedUserId}
              onChange={(e) => onUserChange(Number(e.target.value))}
              className="ml-4 px-3 py-1.5 rounded border border-[var(--sapFieldBorderColor)] bg-[var(--sapFieldBackground)] text-[var(--sapFieldTextColor)]"
            >
              {users.map(u => (
                <option key={u.id} value={u.id}>{u.fullName} ({u.designation})</option>
              ))}
            </select>
          </div>
          <button
            onClick={() => onAssign()}
            className="px-4 py-2 rounded-lg bg-[var(--sapBrandColor)] text-white flex items-center gap-2 hover:opacity-90 transition-opacity"
          >
            <Plus size={18} />
            Assign to Project
          </button>
        </div>
      </div>

      {/* User Info */}
      <div className="p-4 border-b border-[var(--sapGroupContentBorderColor)] bg-[var(--sapListAlternatingBackground)]">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-[var(--sapAccentColor6)] flex items-center justify-center text-white text-lg font-medium">
            {user?.fullName.split(' ').map(n => n[0]).join('')}
          </div>
          <div>
            <div className="text-lg font-semibold text-[var(--sapTextColor)]">{user?.fullName}</div>
            <div className="text-sm text-[var(--sapContentLabelColor)]">{user?.designation} • {user?.department}</div>
            <div className="text-xs text-[var(--sapContentLabelColor)] mt-1">
              Assigned to {assignments.length} project{assignments.length !== 1 ? 's' : ''}
            </div>
          </div>
        </div>
      </div>

      {/* Assignments Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-[var(--sapListHeaderBackground)] border-b border-[var(--sapListBorderColor)]">
            <tr>
              <th className="text-left px-4 py-3 text-xs font-semibold text-[var(--sapListHeaderTextColor)]">Project</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-[var(--sapListHeaderTextColor)]">Responsibility</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-[var(--sapListHeaderTextColor)]">Designation</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-[var(--sapListHeaderTextColor)]">Data Scope</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-[var(--sapListHeaderTextColor)]">Status</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-[var(--sapListHeaderTextColor)]">Valid Period</th>
              <th className="text-right px-4 py-3 text-xs font-semibold text-[var(--sapListHeaderTextColor)]">Actions</th>
            </tr>
          </thead>
          <tbody>
            {assignments.map(assignment => {
              const project = projects[assignment.projectId - 1]; // Map numeric ID to array index
              const template = responsibilityTemplates.find(t => t.id === assignment.templateId);
              
              return (
                <tr key={assignment.id} className="border-b border-[var(--sapListBorderColor)] hover:bg-[var(--sapListHoverBackground)]">
                  <td className="px-4 py-3">
                    <span className="text-sm font-medium text-[var(--sapListTextColor)]">{project?.name}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-sm text-[var(--sapListTextColor)]">{template?.templateName}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-sm text-[var(--sapListTextColor)]">{assignment.designationLabel}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs px-2 py-1 rounded bg-[var(--sapInformationBackground)] text-[var(--sapInformativeTextColor)]">
                      {assignment.dataScope}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-1 rounded ${
                      assignment.status === 'ACTIVE' 
                        ? 'bg-[var(--sapSuccessBackground)] text-[var(--sapPositiveTextColor)]'
                        : 'bg-[var(--sapErrorBackground)] text-[var(--sapNegativeTextColor)]'
                    }`}>
                      {assignment.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-sm text-[var(--sapListTextColor)]">
                      {new Date(assignment.validFrom).toLocaleDateString()}
                      {assignment.validTo && ` - ${new Date(assignment.validTo).toLocaleDateString()}`}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => onAssign(assignment)}
                        className="p-1.5 rounded hover:bg-[var(--sapButtonHoverBackground)] text-[var(--sapButtonTextColor)]"
                        title="Edit"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        className="p-1.5 rounded hover:bg-[var(--sapButtonHoverBackground)] text-[var(--sapNegativeTextColor)]"
                        title="Revoke"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {assignments.length === 0 && (
        <div className="p-8 text-center text-[var(--sapContentLabelColor)]">
          No project assignments for this user
        </div>
      )}
    </div>
  );
}

// ─── View C: Matrix ──────────────────────────────────────────────────────────

function MatrixView({ onAssign }: { onAssign: (assignment?: ProjectAssignment) => void }) {
  return (
    <div className="bg-[var(--sapGroupContentBackground)] rounded-lg shadow-sm p-4">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-[var(--sapTextColor)]">User-Project Matrix</h3>
        <p className="text-sm text-[var(--sapContentLabelColor)] mt-1">
          Click on a cell to assign or edit user responsibilities
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <th className="sticky left-0 bg-[var(--sapListHeaderBackground)] px-4 py-3 text-left text-xs font-semibold text-[var(--sapListHeaderTextColor)] border-b border-r border-[var(--sapListBorderColor)] min-w-[200px]">
                User
              </th>
              {projects.map(project => (
                <th key={project.id} className="px-3 py-3 text-center text-xs font-semibold text-[var(--sapListHeaderTextColor)] border-b border-[var(--sapListBorderColor)] min-w-[120px]">
                  <div className="truncate" title={project.name}>{project.code}</div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {users.filter(u => !u.isSuperAdmin).map(user => (
              <tr key={user.id} className="hover:bg-[var(--sapListHoverBackground)]">
                <td className="sticky left-0 bg-[var(--sapListBackground)] px-4 py-3 border-b border-r border-[var(--sapListBorderColor)]">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-[var(--sapAccentColor6)] flex items-center justify-center text-white text-xs font-medium">
                      {user.fullName.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div className="text-sm text-[var(--sapListTextColor)]">{user.fullName}</div>
                  </div>
                </td>
                {projects.map(project => {
                  const projectNumId = projects.findIndex(p => p.id === project.id) + 1;
                  const assignment = projectAssignments.find(
                    a => a.userId === user.id && a.projectId === projectNumId && a.status === 'ACTIVE'
                  );
                  const template = assignment 
                    ? responsibilityTemplates.find(t => t.id === assignment.templateId)
                    : null;

                  return (
                    <td
                      key={project.id}
                      onClick={() => onAssign(assignment)}
                      className="px-3 py-3 text-center border-b border-[var(--sapListBorderColor)] cursor-pointer hover:bg-[var(--sapListHoverBackground)]"
                    >
                      {template ? (
                        <span className="text-xs px-2 py-1 rounded bg-[var(--sapAccentBackgroundColor6)] text-[var(--sapAccentColor6)] font-medium">
                          {template.templateCode.split('_').map(w => w[0]).join('')}
                        </span>
                      ) : (
                        <span className="text-xs text-[var(--sapContentLabelColor)]">—</span>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Assignment Dialog ───────────────────────────────────────────────────────

function AssignmentDialog({ 
  assignment, 
  onClose, 
  onSave 
}: { 
  assignment: ProjectAssignment | null;
  onClose: () => void;
  onSave: () => void;
}) {
  const [selectedUserId, setSelectedUserId] = useState(assignment?.userId || 2);
  const [selectedProjectId, setSelectedProjectId] = useState(assignment?.projectId || 1);
  const [selectedTemplateId, setSelectedTemplateId] = useState(assignment?.templateId || 2);
  const [designationLabel, setDesignationLabel] = useState(assignment?.designationLabel || '');
  const [dataScope, setDataScope] = useState(assignment?.dataScope || 'PROJECT');

  const template = responsibilityTemplates.find(t => t.id === selectedTemplateId);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-[var(--sapGroupContentBackground)] rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-[var(--sapGroupContentBackground)] border-b border-[var(--sapGroupContentBorderColor)] px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-[var(--sapTextColor)]">
            {assignment ? 'Edit Assignment' : 'New Assignment'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded hover:bg-[var(--sapButtonHoverBackground)] text-[var(--sapContentIconColor)]"
          >
            <XCircle size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Tab 1: Basics */}
          <div>
            <h3 className="text-sm font-semibold text-[var(--sapTextColor)] mb-4">Assignment Details</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[var(--sapTextColor)] mb-2">User</label>
                <select
                  value={selectedUserId}
                  onChange={(e) => setSelectedUserId(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded border border-[var(--sapFieldBorderColor)] bg-[var(--sapFieldBackground)] text-[var(--sapFieldTextColor)]"
                >
                  {users.filter(u => !u.isSuperAdmin).map(u => (
                    <option key={u.id} value={u.id}>{u.fullName}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--sapTextColor)] mb-2">Project</label>
                <select
                  value={selectedProjectId}
                  onChange={(e) => setSelectedProjectId(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded border border-[var(--sapFieldBorderColor)] bg-[var(--sapFieldBackground)] text-[var(--sapFieldTextColor)]"
                >
                  {projects.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--sapTextColor)] mb-2">Responsibility Template</label>
                <select
                  value={selectedTemplateId}
                  onChange={(e) => setSelectedTemplateId(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded border border-[var(--sapFieldBorderColor)] bg-[var(--sapFieldBackground)] text-[var(--sapFieldTextColor)]"
                >
                  {responsibilityTemplates.map(t => (
                    <option key={t.id} value={t.id}>{t.templateName}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--sapTextColor)] mb-2">Designation Label</label>
                <input
                  type="text"
                  value={designationLabel}
                  onChange={(e) => setDesignationLabel(e.target.value)}
                  placeholder="e.g., Project Manager — Package 2"
                  className="w-full px-3 py-2 rounded border border-[var(--sapFieldBorderColor)] bg-[var(--sapFieldBackground)] text-[var(--sapFieldTextColor)]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--sapTextColor)] mb-2">Data Scope</label>
                <select
                  value={dataScope}
                  onChange={(e) => setDataScope(e.target.value as any)}
                  className="w-full px-3 py-2 rounded border border-[var(--sapFieldBorderColor)] bg-[var(--sapFieldBackground)] text-[var(--sapFieldTextColor)]"
                >
                  <option value="OWN">Own records only</option>
                  <option value="SITE">Site-level access</option>
                  <option value="PACKAGE">Package-level access</option>
                  <option value="PROJECT">Full project access</option>
                  <option value="ALL_ASSIGNED">All assigned projects</option>
                </select>
              </div>
            </div>
          </div>

          {/* Template Info */}
          {template && (
            <div className="p-4 rounded-lg bg-[var(--sapInformationBackground)] border border-[var(--sapInformationBorderColor)]">
              <div className="flex items-start gap-3">
                <CheckCircle2 size={20} className="text-[var(--sapInformativeTextColor)] mt-0.5" />
                <div>
                  <div className="text-sm font-medium text-[var(--sapInformativeTextColor)]">
                    {template.templateName}
                  </div>
                  <div className="text-xs text-[var(--sapInformativeTextColor)] mt-1">
                    {template.description}
                  </div>
                  <div className="text-xs text-[var(--sapInformativeTextColor)] mt-2">
                    Grants access to {template.permissionIds.length} permissions
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Impact Preview */}
          <div className="p-4 rounded-lg bg-[var(--sapNeutralBackground)] border border-[var(--sapNeutralBorderColor)]">
            <div className="text-sm font-semibold text-[var(--sapTextColor)] mb-2">Impact Preview</div>
            <div className="text-xs text-[var(--sapContentLabelColor)]">
              This user will be assigned to the selected project with the chosen responsibility template.
              The assignment will grant access to {template?.permissionIds.length || 0} permissions
              with {dataScope} data scope.
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-[var(--sapGroupContentBackground)] border-t border-[var(--sapGroupContentBorderColor)] px-6 py-4 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg border border-[var(--sapButtonBorderColor)] text-[var(--sapButtonTextColor)] hover:bg-[var(--sapButtonHoverBackground)]"
          >
            Cancel
          </button>
          <button
            onClick={onSave}
            className="px-4 py-2 rounded-lg bg-[var(--sapBrandColor)] text-white hover:opacity-90"
          >
            {assignment ? 'Update' : 'Create'} Assignment
          </button>
        </div>
      </div>
    </div>
  );
}
