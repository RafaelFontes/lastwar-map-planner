import { createContext, useContext, useMemo } from 'react';
import { MapEditorService } from '../services/MapEditorService.js';
import {
  LocalStorageTileRepository,
  LocalStorageCommentRepository,
  LocalStorageHistoryRepository,
  FetchTileGeometryRepository
} from '../data/localStorage/index.js';
import {
  SupabaseTileRepository,
  SupabaseCommentRepository,
  SupabaseHistoryRepository
} from '../data/supabase/index.js';
import { isSupabaseConfigured } from '../lib/supabase.js';

/**
 * Context for dependency injection of services
 */
const ServiceContext = createContext(null);

/**
 * Create repositories using localStorage implementation (fallback when Supabase not configured)
 * @returns {Object} Repository instances
 */
function createLocalRepositories() {
  return {
    tileRepository: new LocalStorageTileRepository(),
    commentRepository: new LocalStorageCommentRepository(),
    historyRepository: new LocalStorageHistoryRepository(),
    tileGeometryRepository: new FetchTileGeometryRepository()
  };
}

/**
 * Create repositories using Supabase implementation (when Supabase is configured)
 * @returns {Object} Repository instances
 */
function createSupabaseRepositories() {
  return {
    tileRepository: new SupabaseTileRepository(),
    commentRepository: new SupabaseCommentRepository(),
    historyRepository: new SupabaseHistoryRepository(),
    tileGeometryRepository: new FetchTileGeometryRepository()
  };
}

/**
 * Create default services with their dependencies
 * @param {Object} [repositories] - Optional custom repositories
 * @returns {Object} Service instances
 */
function createDefaultServices(repositories) {
  const repos = repositories || createLocalRepositories();

  return {
    mapEditorService: new MapEditorService(repos),
    // Add more services here as needed
  };
}

/**
 * Provider component for dependency injection
 *
 * @param {Object} props
 * @param {React.ReactNode} props.children
 * @param {Object} [props.repositories] - Optional custom repositories for testing
 * @param {Object} [props.services] - Optional custom services for testing
 */
export function ServiceProvider({ children, repositories, services }) {
  const value = useMemo(() => {
    // If custom services are provided, use them directly
    if (services) {
      return services;
    }

    // If custom repositories are provided, use them
    if (repositories) {
      return createDefaultServices(repositories);
    }

    // Use Supabase repositories when configured, localStorage otherwise
    const repos = isSupabaseConfigured ? createSupabaseRepositories() : createLocalRepositories();
    return createDefaultServices(repos);
  }, [repositories, services]);

  return (
    <ServiceContext.Provider value={value}>
      {children}
    </ServiceContext.Provider>
  );
}

/**
 * Hook to access services from context
 * @returns {Object} Services object
 * @throws {Error} If used outside ServiceProvider
 */
export function useServices() {
  const context = useContext(ServiceContext);
  if (!context) {
    throw new Error('useServices must be used within a ServiceProvider');
  }
  return context;
}

/**
 * Hook to access the MapEditorService
 * @returns {MapEditorService}
 */
export function useMapEditorService() {
  const { mapEditorService } = useServices();
  return mapEditorService;
}

/**
 * Factory function to create a complete DI container
 * Useful for testing or custom configurations
 *
 * @param {Object} [overrides] - Optional overrides for repositories or services
 * @returns {Object} Container with repositories and services
 */
export function createDIContainer(overrides = {}) {
  const repositories = {
    ...createLocalRepositories(),
    ...overrides.repositories
  };

  const services = {
    ...createDefaultServices(repositories),
    ...overrides.services
  };

  return { repositories, services };
}
