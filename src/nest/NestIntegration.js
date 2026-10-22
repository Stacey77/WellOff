/**
 * NestJS-style Integration for WellOff AI Platform
 * 
 * Provides a structured, modular architecture inspired by NestJS patterns:
 * - Dependency injection container
 * - Module system
 * - Controller/Service pattern
 * - Middleware support
 * - Guards and interceptors
 * - Decorators pattern
 */

/**
 * Simple dependency injection container
 */
class Container {
  constructor() {
    this.services = new Map();
    this.singletons = new Map();
  }

  register(token, factory, options = {}) {
    this.services.set(token, { factory, options });
    return this;
  }

  resolve(token) {
    const service = this.services.get(token);
    if (!service) {
      throw new Error(`Service not found: ${token}`);
    }

    if (service.options.singleton) {
      if (!this.singletons.has(token)) {
        this.singletons.set(token, service.factory(this));
      }
      return this.singletons.get(token);
    }

    return service.factory(this);
  }

  has(token) {
    return this.services.has(token);
  }
}

/**
 * Base Module class for organizing related functionality
 */
class Module {
  constructor(metadata = {}) {
    this.imports = metadata.imports || [];
    this.controllers = metadata.controllers || [];
    this.providers = metadata.providers || [];
    this.exports = metadata.exports || [];
  }
}

/**
 * Base Controller class for handling requests
 */
class Controller {
  constructor(path = '') {
    this.basePath = path;
    this.routes = [];
  }

  get(path, handler) {
    this.routes.push({ method: 'GET', path: `${this.basePath}${path}`, handler });
    return this;
  }

  post(path, handler) {
    this.routes.push({ method: 'POST', path: `${this.basePath}${path}`, handler });
    return this;
  }

  put(path, handler) {
    this.routes.push({ method: 'PUT', path: `${this.basePath}${path}`, handler });
    return this;
  }

  delete(path, handler) {
    this.routes.push({ method: 'DELETE', path: `${this.basePath}${path}`, handler });
    return this;
  }

  getRoutes() {
    return this.routes;
  }
}

/**
 * Guard class for route protection
 */
class Guard {
  async canActivate(context) {
    return true;
  }
}

/**
 * Interceptor class for request/response transformation
 */
class Interceptor {
  async intercept(context, next) {
    return next();
  }
}

/**
 * Middleware class for request processing
 */
class Middleware {
  async use(req, res, next) {
    next();
  }
}

/**
 * NestJS-style Application Factory
 */
export class NestIntegration {
  constructor(config = {}) {
    this.config = {
      port: config.port || 3000,
      globalPrefix: config.globalPrefix || '/api',
      cors: config.cors !== false,
      ...config
    };
    this.container = new Container();
    this.modules = [];
    this.controllers = [];
    this.middlewares = [];
    this.guards = [];
    this.interceptors = [];
    this.initialized = false;
  }

  /**
   * Initialize the NestJS-style application
   */
  async initialize() {
    console.log('🪺 Initializing Nest Integration...');
    
    // Register core services
    this.registerCoreServices();
    
    // Initialize all modules
    for (const module of this.modules) {
      await this.initializeModule(module);
    }
    
    this.initialized = true;
    console.log('✅ Nest Integration initialized!');
    return this;
  }

  /**
   * Register core platform services in the DI container
   */
  registerCoreServices() {
    this.container.register('ConfigService', () => ({
      get: (key) => this.config[key],
      getAll: () => ({ ...this.config })
    }), { singleton: true });

    this.container.register('LoggerService', () => ({
      log: (message) => console.log(`[Nest] ${message}`),
      error: (message) => console.error(`[Nest Error] ${message}`),
      warn: (message) => console.warn(`[Nest Warn] ${message}`),
      debug: (message) => console.debug(`[Nest Debug] ${message}`)
    }), { singleton: true });
  }

  /**
   * Initialize a module and its dependencies
   */
  async initializeModule(moduleClass) {
    const module = new moduleClass();
    
    // Register providers
    for (const provider of module.providers) {
      if (typeof provider === 'function') {
        this.container.register(provider.name, (container) => new provider(container), { singleton: true });
      } else if (provider.provide && provider.useClass) {
        this.container.register(provider.provide, (container) => new provider.useClass(container), { singleton: true });
      } else if (provider.provide && provider.useValue) {
        this.container.register(provider.provide, () => provider.useValue, { singleton: true });
      } else if (provider.provide && provider.useFactory) {
        this.container.register(provider.provide, provider.useFactory, { singleton: true });
      }
    }
    
    // Initialize controllers
    for (const controllerClass of module.controllers) {
      const controller = new controllerClass(this.container);
      this.controllers.push(controller);
    }
    
    // Process imports
    for (const importedModule of module.imports) {
      await this.initializeModule(importedModule);
    }
  }

  /**
   * Register a module
   */
  registerModule(moduleClass) {
    this.modules.push(moduleClass);
    return this;
  }

  /**
   * Add global middleware
   */
  use(middleware) {
    this.middlewares.push(middleware);
    return this;
  }

  /**
   * Add global guard
   */
  useGlobalGuard(guard) {
    this.guards.push(guard);
    return this;
  }

  /**
   * Add global interceptor
   */
  useGlobalInterceptor(interceptor) {
    this.interceptors.push(interceptor);
    return this;
  }

  /**
   * Handle an incoming request
   */
  async handleRequest(method, path, body = {}, headers = {}) {
    this.ensureInitialized();

    const context = {
      method,
      path,
      body,
      headers,
      params: {},
      query: {}
    };

    // Create a simple response object for middleware compatibility
    const response = {
      statusCode: 200,
      data: null,
      headers: {},
      status: function(code) { this.statusCode = code; return this; },
      send: function(data) { this.data = data; return this; },
      json: function(data) { this.data = data; return this; },
      setHeader: function(key, value) { this.headers[key] = value; return this; }
    };

    // Run middlewares
    for (const middleware of this.middlewares) {
      await new Promise((resolve, reject) => {
        middleware.use(context, response, (err) => {
          if (err) reject(err);
          else resolve();
        });
      });
    }

    // Run guards
    for (const guard of this.guards) {
      const canActivate = await guard.canActivate(context);
      if (!canActivate) {
        return {
          statusCode: 403,
          message: 'Forbidden'
        };
      }
    }

    // Find matching route
    const route = this.findRoute(method, path);
    if (!route) {
      return {
        statusCode: 404,
        message: 'Not Found'
      };
    }

    // Extract params
    context.params = this.extractParams(route.path, path);

    // Build interceptor chain - each interceptor wraps the next
    const handler = async () => await route.handler(context);
    
    const executeWithInterceptors = this.interceptors.reduceRight(
      (nextHandler, interceptor) => {
        return async () => await interceptor.intercept(context, nextHandler);
      },
      handler
    );

    const result = await executeWithInterceptors();

    return {
      statusCode: 200,
      data: result
    };
  }

  /**
   * Find a matching route
   */
  findRoute(method, path) {
    for (const controller of this.controllers) {
      for (const route of controller.getRoutes()) {
        if (route.method === method && this.matchPath(route.path, path)) {
          return route;
        }
      }
    }
    return null;
  }

  /**
   * Match a route path with params
   */
  matchPath(routePath, requestPath) {
    const routeParts = routePath.split('/').filter(Boolean);
    const requestParts = requestPath.split('/').filter(Boolean);
    
    if (routeParts.length !== requestParts.length) {
      return false;
    }
    
    for (let i = 0; i < routeParts.length; i++) {
      if (routeParts[i].startsWith(':')) {
        continue; // Parameter, matches anything
      }
      if (routeParts[i] !== requestParts[i]) {
        return false;
      }
    }
    
    return true;
  }

  /**
   * Extract route parameters
   */
  extractParams(routePath, requestPath) {
    const params = {};
    const routeParts = routePath.split('/').filter(Boolean);
    const requestParts = requestPath.split('/').filter(Boolean);
    
    for (let i = 0; i < routeParts.length; i++) {
      if (routeParts[i].startsWith(':')) {
        const paramName = routeParts[i].slice(1);
        params[paramName] = requestParts[i];
      }
    }
    
    return params;
  }

  /**
   * Get all registered routes
   */
  getRoutes() {
    const routes = [];
    for (const controller of this.controllers) {
      routes.push(...controller.getRoutes());
    }
    return routes;
  }

  /**
   * Resolve a service from the container
   */
  get(token) {
    return this.container.resolve(token);
  }

  /**
   * Shutdown the application
   */
  async shutdown() {
    console.log('🪺 Shutting down Nest Integration...');
    this.initialized = false;
    console.log('✅ Nest Integration shut down');
  }

  /**
   * Ensure the application is initialized
   */
  ensureInitialized() {
    if (!this.initialized) {
      throw new Error('Nest Integration not initialized. Call initialize() first.');
    }
  }
}

// Export base classes for extending
export { Container, Module, Controller, Guard, Interceptor, Middleware };

export default NestIntegration;
