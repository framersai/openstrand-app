'use client';

import { EXPLORATION_RECIPES } from '@/config/recipes';

interface ExplorationRecipesProps {
  onRunRecipe: (prompt: string) => void;
  disabled?: boolean;
}

const CATEGORY_LABELS = {
  rankings: 'Rankings',
  trends: 'Trends',
  segments: 'Segments',
  cohorts: 'Cohorts',
} as const;

export function ExplorationRecipes({ onRunRecipe, disabled = false }: ExplorationRecipesProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-semibold">Exploration recipes</h3>
          <p className="text-xs text-muted-foreground">Kickstart analyses with curated templates.</p>
        </div>
        <span className="rounded-full border border-border px-2 py-0.5 text-[10px] uppercase tracking-wide text-muted-foreground">
          curated
        </span>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        {EXPLORATION_RECIPES.map((recipe) => (
          <button
            key={recipe.id}
            onClick={() => !disabled && onRunRecipe(recipe.prompt)}
            disabled={disabled}
            className="group rounded-2xl border border-border/70 bg-card/60 p-4 text-left transition hover:border-primary/40 hover:bg-primary/5 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <div className="flex items-center justify-between text-xs uppercase tracking-wide text-muted-foreground">
              <span>{CATEGORY_LABELS[recipe.category]}</span>
              <span className="font-semibold text-foreground/70">{recipe.icon}</span>
            </div>
            <h4 className="mt-2 text-sm font-semibold">{recipe.title}</h4>
            <p className="mt-1 text-xs text-muted-foreground">{recipe.description}</p>
            {recipe.highlights && (
              <div className="mt-2 flex flex-wrap gap-1">
                {recipe.highlights.map((highlight) => (
                  <span
                    key={highlight}
                    className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary"
                  >
                    {highlight}
                  </span>
                ))}
              </div>
            )}
            {recipe.debugContext && (
              <p className="mt-2 text-[11px] text-muted-foreground">{recipe.debugContext}</p>
            )}
            <span className="mt-3 inline-flex text-xs font-medium text-primary group-hover:underline">
              Use this recipe →
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
