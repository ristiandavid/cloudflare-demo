import { useState } from 'react';
import { Icon } from '@iconify/react';

/**
 * AssignModal - Assign an owner to a feedback theme
 * 
 * Shows a list of team members and allows selection.
 */

interface AssignModalProps {
  themeId: string;
  themeTitle: string;
  onClose: () => void;
  onAssign: (themeId: string, owner: TeamMember) => void;
}

interface TeamMember {
  id: string;
  name: string;
  role: string;
  avatar?: string;
  initials: string;
  color: string;
}

// Mock team members - in a real app, this would come from the backend
const TEAM_MEMBERS: TeamMember[] = [
  { id: '1', name: 'Ristian David', role: 'Product Manager', initials: 'RD', color: '#f48120' },
  { id: '2', name: 'Sarah Chen', role: 'Engineering Lead', initials: 'SC', color: '#388bfd' },
  { id: '3', name: 'Mike Johnson', role: 'Support Manager', initials: 'MJ', color: '#238636' },
  { id: '4', name: 'Emily Brown', role: 'QA Engineer', initials: 'EB', color: '#a371f7' },
  { id: '5', name: 'Alex Kim', role: 'Developer', initials: 'AK', color: '#cf222e' },
];

export function AssignModal({ themeId, themeTitle, onClose, onAssign }: AssignModalProps) {
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);
  const [search, setSearch] = useState('');
  const [isAssigning, setIsAssigning] = useState(false);

  const filteredMembers = TEAM_MEMBERS.filter(member =>
    member.name.toLowerCase().includes(search.toLowerCase()) ||
    member.role.toLowerCase().includes(search.toLowerCase())
  );

  const handleAssign = () => {
    if (!selectedMember) return;
    
    setIsAssigning(true);
    // Simulate API call
    setTimeout(() => {
      onAssign(themeId, selectedMember);
      setIsAssigning(false);
      onClose();
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-background border border-border rounded-xl shadow-2xl w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-border">
          <div>
            <h2 className="text-lg font-semibold text-foreground">Assign Owner</h2>
            <p className="text-sm text-muted-foreground mt-0.5 truncate max-w-[300px]">
              {themeTitle}
            </p>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 text-muted-foreground hover:text-foreground transition-colors"
          >
            <Icon icon="solar:close-circle-bold" className="size-5" />
          </button>
        </div>

        {/* Search */}
        <div className="p-4 border-b border-border">
          <div className="relative">
            <Icon 
              icon="solar:magnifer-linear" 
              className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" 
            />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search team members..."
              className="w-full bg-secondary border border-border rounded-lg pl-10 pr-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>
        </div>

        {/* Team members list */}
        <div className="max-h-[300px] overflow-y-auto p-2">
          {filteredMembers.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No team members found
            </div>
          ) : (
            filteredMembers.map((member) => (
              <button
                key={member.id}
                onClick={() => setSelectedMember(member)}
                className={`w-full flex items-center gap-3 p-3 rounded-lg transition-colors ${
                  selectedMember?.id === member.id
                    ? 'bg-primary/10 border border-primary/30'
                    : 'hover:bg-secondary border border-transparent'
                }`}
              >
                <div 
                  className="size-10 rounded-full flex items-center justify-center text-sm text-white font-bold shrink-0"
                  style={{ backgroundColor: member.color }}
                >
                  {member.initials}
                </div>
                <div className="flex-1 text-left">
                  <div className="font-medium text-foreground">{member.name}</div>
                  <div className="text-xs text-muted-foreground">{member.role}</div>
                </div>
                {selectedMember?.id === member.id && (
                  <Icon icon="solar:check-circle-bold" className="size-5 text-primary" />
                )}
              </button>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-4 border-t border-border bg-secondary/30">
          <button 
            onClick={onClose}
            className="text-sm font-medium px-4 py-2 rounded bg-secondary hover:bg-accent text-foreground border border-border transition-colors"
          >
            Cancel
          </button>
          <button 
            onClick={handleAssign}
            disabled={!selectedMember || isAssigning}
            className="text-sm font-medium px-4 py-2 rounded bg-primary hover:bg-primary/90 text-primary-foreground transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isAssigning ? (
              <>
                <Icon icon="solar:refresh-bold" className="size-4 animate-spin" />
                Assigning...
              </>
            ) : (
              <>
                <Icon icon="solar:user-check-bold" className="size-4" />
                Assign
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
