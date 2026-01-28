import DashboardWidget from '../DashboardWidget';

const SKILLS = [
  { name: "Artisanat, construire", link: "DEX/INT" },
  { name: "Combat rapproché", link: "FOR/DEX" },
  { name: "Combat à distance", link: "DEX/INT" },
  { name: "Connaissance de la nature", link: "INT/END" },
  { name: "Connaissance des secrets", link: "INT/CHA" },
  { name: "Courir, sauter", link: "FOR/END" },
  { name: "Discrétion", link: "DEX/INT" },
  { name: "Droit", link: "INT/CHA" },
  { name: "Esquiver", link: "DEX/END" },
  { name: "Intimider", link: "FOR/CHA" },
  { name: "Lire, écrire", link: "INT/CHA" },
  { name: "Mentir, convaincre", link: "INT/CHA" },
  { name: "Perception", link: "INT/END" },
  { name: "Piloter", link: "DEX/INT" },
  { name: "Psychologie", link: "INT/CHA" },
  { name: "Réflexes", link: "DEX/END" },
  { name: "Serrures et pièges", link: "DEX/INT" },
  { name: "Soigner", link: "INT/END" },
  { name: "Survie", link: "FOR/INT" },
  { name: "Voler", link: "DEX/INT" }
];

export default function SkillsWidget({ formData, onSkillChange, canEdit, widgetId }) {
  return (
    <DashboardWidget title="Compétences de base" icon="📜" color="green" widgetId={widgetId}>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-0.5">
        {SKILLS.map((skill, index) => (
          <div key={index} className="flex items-center gap-1 p-1 bg-white/80 rounded hover:bg-green-50 transition-colors">
            <span className="text-[10px] text-green-900 flex-1 font-medium truncate" title={skill.name}>
              {skill.name}
            </span>
            <input
              type="number"
              value={formData.skills[skill.name] || ''}
              onChange={(e) => onSkillChange(skill.name, e.target.value)}
              className="w-10 p-0.5 border border-green-300 bg-white text-green-900 text-center rounded text-xs focus:border-green-500 transition-colors font-semibold"
              disabled={!canEdit}
            />
            <span className="text-[10px] text-green-700">%</span>
          </div>
        ))}
      </div>
    </DashboardWidget>
  );
}
