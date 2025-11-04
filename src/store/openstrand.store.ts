/**
 * OpenStrand Zustand Store
 * Global state management for the application
 */

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { openstrandAPI, APIError } from '@/services/openstrand.api';
import type {
  Strand,
  DailySchedule,
  ScheduleItem,
  ContentEnhancement,
  OpenStrandStore,
  StrandPermission,
  QualityMatrix,
  CapabilityMatrix,
  StrandStructureRequest,
  StructureRequestType,
  StructureRequestStatus,
  Relationship,
  PlaceholderPreferences,
  GrantPermissionPayload,
  QualityVotePayload,
  ShareLinkResponse,
  AccessRole,
} from '@/types/openstrand';
import { LearningPhase } from '@/types/openstrand';

const learningPhaseValues = Object.values(LearningPhase);

const OFFLINE_MODE_FALLBACK =
  typeof process !== 'undefined' ? process.env.NEXT_PUBLIC_OFFLINE_MODE === 'true' : false;

const createOfflineCapabilities = (): CapabilityMatrix => ({
  analysisPipeline: false,
  documentAnalysis: false,
  mediaAnalysis: false,
  dynamicVisualizations: false,
  generativeVisualizations: false,
  topContent: false,
  aiArtisan: true,
  knowledgeGraph: false,
  analytics: {
    googleAnalytics: false,
    clarity: false,
  },
  compliance: {
    gdpr: false,
    cookieConsent: false,
  },
  environment: {
    mode: 'offline',
    auth: 'local',
  },
  storage: {
    driver: 'sqlite',
    path: undefined,
    writable: true,
  },
  local: {
    onboardingComplete: false,
  },
});

const normalizeLearningPhase = (value: string | undefined): LearningPhase =>
  value && learningPhaseValues.includes(value as LearningPhase)
    ? (value as LearningPhase)
    : LearningPhase.INTRODUCTION;

const sortStructureRequests = (requests: StrandStructureRequest[]): StrandStructureRequest[] =>
  [...requests].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );

/**
 * OpenStrand store with persistence and devtools
 */
export const useOpenStrandStore = create<OpenStrandStore>()(
  devtools(
    persist(
      (set, get) => ({
        // Initial state
        strands: [],
        currentStrand: null,
        weave: null,
        schedule: null,
        progress: {},
        permissions: {},
        qualitySnapshots: {},
        structureRequests: {},
        capabilities: null,
        placeholderPreferences: null,
        topVisualizations: [],
        topDatasets: [],
        artisanQuota: null,
        localOnboardingComplete: false,
        teamOnboardingComplete: false,
        loading: false,
        error: null,

        // Strand actions
        loadStrands: async (filters?: Record<string, unknown>) => {
          set({ loading: true, error: null });
          try {
            const result = await openstrandAPI.strands.list(filters);
            set((state) => ({
              strands: result.strands,
              loading: false,
              structureRequests: {
                ...state.structureRequests,
                ...Object.fromEntries(
                  result.strands.map((strand) => [strand.id, strand.structureRequests ?? []]),
                ),
              },
            }));
          } catch (error) {
            set({
              error: error instanceof Error ? error.message : 'Failed to load strands',
              loading: false,
            });
          }
        },

        loadStrand: async (id: string) => {
          set({ loading: true, error: null });
          try {
            const strand = await openstrandAPI.strands.get(id);
            set((state) => ({
              currentStrand: strand,
              loading: false,
              structureRequests: {
                ...state.structureRequests,
                [id]: strand.structureRequests ?? [],
              },
            }));
          } catch (error) {
            set({
              error: error instanceof Error ? error.message : 'Failed to load strand',
              loading: false,
            });
          }
        },

        createStrand: async (strand: Partial<Strand>) => {
          set({ loading: true, error: null });
          try {
            const newStrand = await openstrandAPI.strands.create(strand);
            set((state) => ({
              strands: [...state.strands, newStrand],
              currentStrand: newStrand,
              structureRequests: {
                ...state.structureRequests,
                [newStrand.id]: newStrand.structureRequests ?? [],
              },
              loading: false,
            }));
          } catch (error) {
            set({
              error: error instanceof Error ? error.message : 'Failed to create strand',
              loading: false,
            });
          }
        },
        updateStrand: async (id: string, updates: Partial<Strand>) => {
          set({ loading: true, error: null });
          try {
            const updated = await openstrandAPI.strands.update(id, updates);
            set((state) => ({
              strands: state.strands.map((s) => (s.id === id ? updated : s)),
              currentStrand: state.currentStrand?.id === id ? updated : state.currentStrand,
              structureRequests: {
                ...state.structureRequests,
                [id]: updated.structureRequests ?? state.structureRequests[id] ?? [],
              },
              loading: false,
            }));
          } catch (error) {
            set({
              error: error instanceof Error ? error.message : 'Failed to update strand',
              loading: false,
            });
          }
        },
        deleteStrand: async (id: string) => {
          set({ loading: true, error: null });
          try {
            await openstrandAPI.strands.delete(id);
            set((state) => {
              const { [id]: _removed, ...rest } = state.structureRequests;
              return {
                strands: state.strands.filter((s) => s.id !== id),
                currentStrand: state.currentStrand?.id === id ? null : state.currentStrand,
                structureRequests: rest,
                loading: false,
              };
            });
          } catch (error) {
            set({
              error: error instanceof Error ? error.message : 'Failed to delete strand',
              loading: false,
            });
          }
        },

        uploadContent: async (file: File, metadata?: Record<string, unknown>) => {
          set({ loading: true, error: null });
          try {
            const strand = await openstrandAPI.strands.upload(file, metadata);
            set(state => ({
              strands: [...state.strands, strand],
              currentStrand: strand,
              loading: false
            }));
          } catch (error) {
            set({
              error: error instanceof Error ? error.message : 'Failed to upload content',
              loading: false
            });
          }
        },

        createRelationship: async (strandId: string, relationship: Relationship) => {
          try {
            await openstrandAPI.strands.createRelationship(strandId, relationship);
            if (get().currentStrand?.id === strandId) {
              const refreshed = await openstrandAPI.strands.get(strandId);
              set((state) => ({
                currentStrand: refreshed,
                strands: state.strands.map((s) => (s.id === strandId ? refreshed : s)),
                structureRequests: {
                  ...state.structureRequests,
                  [strandId]: refreshed.structureRequests ?? state.structureRequests[strandId] ?? [],
                },
              }));
            }
          } catch (error) {
            set({
              error: error instanceof Error ? error.message : 'Failed to create relationship',
            });
          }
        },

        removeRelationship: async (
          strandId: string,
          targetId: string,
          options?: { type?: string; scopeId?: string },
        ) => {
          try {
            await openstrandAPI.strands.removeRelationship(strandId, targetId, options);
            if (get().currentStrand?.id === strandId) {
              const refreshed = await openstrandAPI.strands.get(strandId);
              set((state) => ({
                currentStrand: refreshed,
                strands: state.strands.map((s) => (s.id === strandId ? refreshed : s)),
                structureRequests: {
                  ...state.structureRequests,
                  [strandId]: refreshed.structureRequests ?? state.structureRequests[strandId] ?? [],
                },
              }));
            }
          } catch (error) {
            set({
              error: error instanceof Error ? error.message : 'Failed to remove relationship',
            });
          }
        },

        // Weave actions
        loadWeave: async (filters?: Record<string, unknown>) => {
          set({ loading: true, error: null });
          try {
            const weave = await openstrandAPI.weave.get(filters);
            set({ weave, loading: false });
          } catch (error) {
            set({
              error: error instanceof Error ? error.message : 'Failed to load knowledge graph',
              loading: false
            });
          }
        },

        findPath: async (source: string, target: string) => {
          set({ loading: true, error: null });
          try {
            const path = await openstrandAPI.weave.findPath(source, target);
            // Update weave with highlighted path
            set(state => {
              if (state.weave) {
                // Mark path edges in the weave
                const pathEdgeIds = new Set(path.edges.map(e => `${e.source}-${e.target}`));
                const updatedEdges = state.weave.edges.map(edge => ({
                  ...edge,
                  metadata: {
                    ...edge.metadata,
                    highlighted: pathEdgeIds.has(`${edge.source}-${edge.target}`)
                  }
                }));

                return {
                  weave: { ...state.weave, edges: updatedEdges },
                  loading: false
                };
              }
              return { loading: false };
            });
          } catch (error) {
            set({
              error: error instanceof Error ? error.message : 'Failed to find path',
              loading: false
            });
          }
        },

        getRecommendations: async () => {
          const { progress } = get();
          const completedIds = Object.entries(progress)
            .filter(([_, p]) => p.mastery_level > 0.5)
            .map(([id, _]) => id);

          set({ loading: true, error: null });
          try {
            const recommendations = await openstrandAPI.weave.getRecommendations(completedIds);
            // Store recommendations in weave metadata
            set(state => {
              if (state.weave) {
                return {
                  weave: {
                    ...state.weave,
                    metrics: {
                      ...state.weave.metrics,
                      recommendations
                    }
                  },
                  loading: false
                };
              }
              return { loading: false };
            });
          } catch (error) {
            set({
              error: error instanceof Error ? error.message : 'Failed to get recommendations',
              loading: false
            });
          }
        },

        // Learning actions
        loadSchedule: async (date?: string) => {
          set({ loading: true, error: null });
          try {
            const schedule = await openstrandAPI.learning.getDailySchedule(date);
            const baseUser = schedule.user_id ?? 'current-user';

            const normalizedItems: ScheduleItem[] = schedule.items.map(item => ({
              id: item.id,
              strand_id: item.strand_id,
              user_id: item.user_id ?? baseUser,
              scheduled_for: item.scheduled_for,
              type: item.type,
              status: item.status ?? 'scheduled',
              phase: normalizeLearningPhase(item.phase),
              estimated_duration: item.estimated_duration ?? item.duration,
              actual_duration: item.actual_duration,
              quality: item.quality,
              notes: item.notes,
              completed_at: item.completed_at,
              sm2_data: item.sm2_data,
            }));

            const normalizedSchedule: DailySchedule = {
              date: schedule.date ?? new Date().toISOString().slice(0, 10),
              user_id: baseUser,
              items: normalizedItems,
              total_duration: schedule.total_duration,
              review_items: normalizedItems.filter(item => item.type === 'review'),
              new_items: normalizedItems.filter(item => item.type === 'new'),
              practice_items: normalizedItems.filter(item => item.type === 'practice'),
            };

            set({
              schedule: normalizedSchedule,
              loading: false
            });
          } catch (error) {
            set({
              error: error instanceof Error ? error.message : 'Failed to load schedule',
              loading: false
            });
          }
        },

        recordProgress: async (strandId: string, quality: number, timeSpent: number) => {
          set({ loading: true, error: null });
          try {
            const result = await openstrandAPI.learning.recordProgress(strandId, quality, timeSpent);
            const nextPhase = normalizeLearningPhase(result.phase);

            // Update progress state
            set(state => ({
              progress: {
                ...state.progress,
                [strandId]: {
                  user_id: 'current-user', // TODO: Get from auth
                  strand_id: strandId,
                  phase: nextPhase,
                  mastery_level: result.mastery_level,
                  total_time_spent: timeSpent,
                  review_count: (state.progress[strandId]?.review_count || 0) + 1,
                  last_accessed: new Date().toISOString(),
                  scaffold_level: state.progress[strandId]?.scaffold_level || 'guided'
                }
              },
              loading: false
            }));
          } catch (error) {
            set({
              error: error instanceof Error ? error.message : 'Failed to record progress',
              loading: false
            });
          }
        },

        enhanceContent: async (strandId: string): Promise<ContentEnhancement> => {
          set({ loading: true, error: null });
          try {
            const enhancement = await openstrandAPI.ai.enhanceContent(strandId);
            set({ loading: false });
            return enhancement;
          } catch (error) {
            set({
              error: error instanceof Error ? error.message : 'Failed to enhance content',
              loading: false
            });
            throw error;
          }
        },

        // Sharing & permissions
        loadPermissions: async (strandId: string): Promise<StrandPermission[]> => {
          set({ loading: true, error: null });
          try {
            const permissions = await openstrandAPI.strands.listPermissions(strandId);
            set(state => ({
              permissions: { ...state.permissions, [strandId]: permissions },
              loading: false
            }));
            return permissions;
          } catch (error) {
            set({
              error: error instanceof Error ? error.message : 'Failed to load permissions',
              loading: false
            });
            return [];
          }
        },

        grantPermission: async (strandId: string, payload: GrantPermissionPayload) => {
          set({ loading: true, error: null });
          try {
            const permission = await openstrandAPI.strands.grantPermission(strandId, payload);
            set(state => {
              const existing = state.permissions[strandId] ?? [];
              const updated = [...existing.filter(p => p.id !== permission.id), permission];
              return {
                permissions: { ...state.permissions, [strandId]: updated },
                loading: false
              };
            });
          } catch (error) {
            set({
              error: error instanceof Error ? error.message : 'Failed to grant permission',
              loading: false
            });
            throw error;
          }
        },

        revokePermission: async (strandId: string, permissionId: string) => {
          set({ loading: true, error: null });
          try {
            await openstrandAPI.strands.revokePermission(strandId, permissionId);
            set(state => {
              const existing = state.permissions[strandId] ?? [];
              return {
                permissions: {
                  ...state.permissions,
                  [strandId]: existing.filter(p => p.id !== permissionId)
                },
                loading: false
              };
            });
          } catch (error) {
            set({
              error: error instanceof Error ? error.message : 'Failed to revoke permission',
              loading: false
            });
            throw error;
          }
        },

        createShareLink: async (
          strandId: string,
          role: AccessRole,
          expires_at?: string
        ): Promise<ShareLinkResponse> => {
          set({ loading: true, error: null });
          try {
            const link = await openstrandAPI.strands.createShareLink(strandId, { role, expires_at });
            set({ loading: false });
            return link;
          } catch (error) {
            set({
              error: error instanceof Error ? error.message : 'Failed to create share link',
              loading: false
            });
            throw error;
          }
        },

        submitStructureRequest: async (
          strandId: string,
          payload: {
            scopeId: string;
            type: StructureRequestType;
            parentId?: string;
            targetId?: string;
            position?: number;
            metadata?: Record<string, unknown>;
            justification?: string;
          },
        ): Promise<StrandStructureRequest | null> => {
          try {
            const request = await openstrandAPI.strands.requestStructureChange(strandId, payload);
            if (request) {
              set((state) => {
                const existing = state.structureRequests[strandId] ?? [];
                const updated = sortStructureRequests([
                  request,
                  ...existing.filter((r) => r.id !== request.id),
                ]);
                return {
                  structureRequests: {
                    ...state.structureRequests,
                    [strandId]: updated,
                  },
                  currentStrand:
                    state.currentStrand?.id === strandId
                      ? { ...state.currentStrand, structureRequests: updated }
                      : state.currentStrand,
                };
              });
            }
            return request ?? null;
          } catch (error) {
            set({
              error: error instanceof Error ? error.message : 'Failed to submit structure request',
            });
            return null;
          }
        },

        loadStructureRequests: async (
          strandId: string,
          options?: { scopeId?: string; status?: StructureRequestStatus | 'ALL'; limit?: number },
        ): Promise<StrandStructureRequest[]> => {
          try {
            const requests = await openstrandAPI.strands.listStructureRequests(strandId, options);
            set((state) => {
              const existing = state.structureRequests[strandId] ?? [];
              const mergedForState = (() => {
                if (!options || (!options.scopeId && (!options.status || options.status === 'ALL'))) {
                  return sortStructureRequests(requests);
                }
                if (options.scopeId) {
                  const other = existing.filter((request) => request.scopeId !== options.scopeId);
                  return sortStructureRequests([...requests, ...other]);
                }
                const byId = new Map<string, StrandStructureRequest>();
                existing.forEach((request) => byId.set(request.id, request));
                requests.forEach((request) => byId.set(request.id, request));
                return sortStructureRequests(Array.from(byId.values()));
              })();

              const mergedForCurrent = (() => {
                const current = state.currentStrand?.structureRequests ?? [];
                if (!options || (!options.scopeId && (!options.status || options.status === 'ALL'))) {
                  return sortStructureRequests(requests);
                }
                if (options.scopeId) {
                  const other = current.filter((request) => request.scopeId !== options.scopeId);
                  return sortStructureRequests([...requests, ...other]);
                }
                const byId = new Map<string, StrandStructureRequest>();
                current.forEach((request) => byId.set(request.id, request));
                requests.forEach((request) => byId.set(request.id, request));
                return sortStructureRequests(Array.from(byId.values()));
              })();

              return {
                structureRequests: {
                  ...state.structureRequests,
                  [strandId]: mergedForState,
                },
                currentStrand:
                  state.currentStrand?.id === strandId
                    ? { ...state.currentStrand, structureRequests: mergedForCurrent }
                    : state.currentStrand,
              };
            });
            return requests;
          } catch (error) {
            set({
              error: error instanceof Error ? error.message : 'Failed to load structure requests',
            });
            return [];
          }
        },

        resolveStructureRequest: async (
          requestId: string,
          action: 'approve' | 'reject' | 'cancel',
          note?: string,
        ): Promise<StrandStructureRequest | null> => {
          try {
            const request = await openstrandAPI.strands.resolveStructureRequest(requestId, action, note);
            if (request) {
              const strandId = request.strandId;
              set((state) => {
                const existing = state.structureRequests[strandId] ?? [];
                const updated = sortStructureRequests(
                  existing.map((r) => (r.id === request.id ? request : r)),
                );
                return {
                  structureRequests: {
                    ...state.structureRequests,
                    [strandId]: updated,
                  },
                  currentStrand:
                    state.currentStrand?.id === strandId
                      ? { ...state.currentStrand, structureRequests: updated }
                      : state.currentStrand,
                };
              });
              return request;
            }

            let resolvedStrandId: string | undefined;
            set((state) => {
              const updatedMap: Record<string, StrandStructureRequest[]> = { ...state.structureRequests };
              for (const [sid, requests] of Object.entries(updatedMap)) {
                if (requests.some((r) => r.id === requestId)) {
                  updatedMap[sid] = requests.filter((r) => r.id !== requestId);
                  resolvedStrandId = sid;
                  break;
                }
              }
              return {
                structureRequests: updatedMap,
                currentStrand:
                  resolvedStrandId && state.currentStrand?.id === resolvedStrandId
                    ? { ...state.currentStrand, structureRequests: updatedMap[resolvedStrandId] }
                    : state.currentStrand,
              };
            });
            return null;
          } catch (error) {
            set({
              error: error instanceof Error ? error.message : 'Failed to resolve structure request',
            });
            return null;
          }
        },

        loadQuality: async (strandId: string): Promise<QualityMatrix> => {
          set({ loading: true, error: null });
          try {
            const quality = await openstrandAPI.strands.getQuality(strandId);
            set(state => ({
              qualitySnapshots: { ...state.qualitySnapshots, [strandId]: quality },
              loading: false
            }));
            return quality;
          } catch (error) {
            set({
              error: error instanceof Error ? error.message : 'Failed to load quality data',
              loading: false
            });
            throw error;
          }
        },

        submitQualityVote: async (
          strandId: string,
          payload: QualityVotePayload
        ): Promise<QualityMatrix> => {
          set({ loading: true, error: null });
          try {
            const updatedQuality = await openstrandAPI.strands.submitQualityVote(strandId, payload);
            set(state => ({
              qualitySnapshots: { ...state.qualitySnapshots, [strandId]: updatedQuality },
              currentStrand: state.currentStrand?.id === strandId
                ? { ...state.currentStrand, quality: updatedQuality }
                : state.currentStrand,
              loading: false
            }));
            return updatedQuality;
          } catch (error) {
            set({
              error: error instanceof Error ? error.message : 'Failed to submit vote',
              loading: false
            });
            throw error;
          }
        },

        loadCapabilities: async () => {
          if (get().capabilities) {
            return get().capabilities;
          }
          try {
            const capabilities = await openstrandAPI.meta.capabilities();
            const environmentMode =
              capabilities?.environment?.mode ??
              (OFFLINE_MODE_FALLBACK ? 'offline' : 'cloud');

            const normalized: CapabilityMatrix = {
              analysisPipeline: capabilities?.analysisPipeline ?? false,
              documentAnalysis: capabilities?.documentAnalysis ?? false,
              mediaAnalysis: capabilities?.mediaAnalysis ?? false,
              dynamicVisualizations: capabilities?.dynamicVisualizations ?? false,
              generativeVisualizations: capabilities?.generativeVisualizations ?? false,
              topContent: capabilities?.topContent ?? false,
              aiArtisan: capabilities?.aiArtisan ?? false,
              knowledgeGraph: capabilities?.knowledgeGraph ?? false,
              analytics: {
                googleAnalytics: capabilities?.analytics?.googleAnalytics ?? false,
                clarity: capabilities?.analytics?.clarity ?? false,
              },
              compliance: {
                gdpr: capabilities?.compliance?.gdpr ?? false,
                cookieConsent: capabilities?.compliance?.cookieConsent ?? false,
              },
              environment: {
                mode: environmentMode,
                auth: capabilities?.environment?.auth,
                storagePath: capabilities?.environment?.storagePath,
              },
              storage: capabilities?.storage
                ? {
                    driver: capabilities.storage.driver,
                    path: capabilities.storage.path,
                    writable: capabilities.storage.writable,
                  }
                : undefined,
              local: {
                onboardingComplete:
                  capabilities?.local?.onboardingComplete ?? environmentMode !== 'offline',
              },
            };
            set({
              capabilities: normalized,
              localOnboardingComplete: normalized.local?.onboardingComplete ?? false,
              teamOnboardingComplete:
                normalized.environment?.mode === 'cloud'
                  ? normalized.local?.onboardingComplete ?? false
                  : false,
            });
            return normalized;
          } catch (error) {
            if (error instanceof APIError && error.status === 404) {
              const fallback = createOfflineCapabilities();
              set({
                capabilities: fallback,
                localOnboardingComplete: fallback.local?.onboardingComplete ?? false,
                teamOnboardingComplete: false,
              });
              return fallback;
            }
            const fallback = createOfflineCapabilities();
            set({
              error: error instanceof Error ? error.message : 'Failed to load capabilities',
              capabilities: fallback,
              localOnboardingComplete: fallback.local?.onboardingComplete ?? false,
              teamOnboardingComplete: false,
            });
            return fallback;
          }
        },

        loadArtisanQuota: async () => {
          try {
            const quota = await openstrandAPI.ai.getArtisanQuota();
            set({ artisanQuota: quota });
            return quota ?? null;
          } catch (error) {
            if (error instanceof APIError && (error.status === 401 || error.status === 404)) {
              set({ artisanQuota: null });
              return null;
            }
            set({
              error: error instanceof Error ? error.message : 'Failed to load AI Artisan quota',
            });
            return null;
          }
        },

        loadTopVisualizations: async (limit: number = 10) => {
          try {
            const items = await openstrandAPI.visualizations.getTop(limit);
            set({ topVisualizations: items });
            return items;
          } catch (error) {
            if (error instanceof APIError && error.status === 404) {
              return [];
            }
            set({
              error: error instanceof Error ? error.message : 'Failed to load visualizations',
            });
            return [];
          }
        },

        loadTopDatasets: async (limit: number = 10) => {
          try {
            const items = await openstrandAPI.datasets.getTop(limit);
            set({ topDatasets: items });
            return items;
          } catch (error) {
            if (error instanceof APIError && error.status === 404) {
              return [];
            }
            set({
              error: error instanceof Error ? error.message : 'Failed to load datasets',
            });
            return [];
          }
        },
        completeLocalOnboarding: async (completed: boolean = true) => {
          try {
            await openstrandAPI.system.completeLocalOnboarding(completed);
            set({ localOnboardingComplete: completed });
            await get().loadCapabilities();
          } catch (error) {
            if (error instanceof APIError && error.status === 400) {
              set({ localOnboardingComplete: completed });
              return;
            }
            set({
              error: error instanceof Error ? error.message : 'Failed to update onboarding status',
            });
            throw error;
          }
        },
        completeTeamOnboarding: async (completed: boolean = true) => {
          try {
            await openstrandAPI.system.completeTeamOnboarding(completed);
            set({ teamOnboardingComplete: completed });
          } catch (error) {
            if (error instanceof APIError && (error.status === 400 || error.status === 404)) {
              set({ teamOnboardingComplete: completed });
              return;
            }
            set({
              error:
                error instanceof Error
                  ? error.message
                  : 'Failed to update team onboarding status',
            });
            throw error;
          }
        },
        loadPlaceholderPreferences: async (): Promise<PlaceholderPreferences | null> => {
          try {
            const preferences = await openstrandAPI.meta.getPlaceholderPreferences();
            set({ placeholderPreferences: preferences });
            return preferences;
          } catch (error) {
            set({
              error: error instanceof Error ? error.message : 'Failed to load placeholder preferences',
            });
            return null;
          }
        },

        updatePlaceholderPreferences: async (
          preferences: PlaceholderPreferences,
        ): Promise<PlaceholderPreferences | null> => {
          try {
            const updated = await openstrandAPI.meta.updatePlaceholderPreferences(preferences);
            set({ placeholderPreferences: updated });
            return updated;
          } catch (error) {
            set({
              error: error instanceof Error ? error.message : 'Failed to update placeholder preferences',
            });
            return null;
          }
        },

        refreshQuality: async (strandId: string) => {
          set({ loading: true, error: null });
          try {
            await openstrandAPI.strands.refreshQuality(strandId);
            set({ loading: false });
          } catch (error) {
            set({
              error: error instanceof Error ? error.message : 'Failed to refresh quality',
              loading: false
            });
            throw error;
          }
        },

        // Error handling
        setError: (error: string | null) => set({ error }),
        clearError: () => set({ error: null }),
      }),
      {
        name: 'openstrand-store',
        // Only persist certain fields
        partialize: (state) => ({
          progress: state.progress,
          localOnboardingComplete: state.localOnboardingComplete,
          teamOnboardingComplete: state.teamOnboardingComplete,
          // Don't persist transient data like loading, error, or large data
        }),
      }
    )
  )
);

// Selector hooks for common queries
export const useCurrentStrand = () => useOpenStrandStore(state => state.currentStrand);
export const useWeave = () => useOpenStrandStore(state => state.weave);
export const useSchedule = () => useOpenStrandStore(state => state.schedule);
export const useProgress = (strandId: string) =>
  useOpenStrandStore(state => state.progress[strandId]);
export const useLoading = () => useOpenStrandStore(state => state.loading);
export const useError = () => useOpenStrandStore(state => state.error);
export const useCapabilities = () => useOpenStrandStore(state => state.capabilities);
export const useTopVisualizations = () => useOpenStrandStore(state => state.topVisualizations);
export const useTopDatasets = () => useOpenStrandStore(state => state.topDatasets);
