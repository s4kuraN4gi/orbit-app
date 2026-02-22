export class OrbitError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'OrbitError';
  }
}

export class AuthError extends OrbitError {
  constructor(message = 'Not authenticated. Run `orbit login` first.') {
    super(message);
    this.name = 'AuthError';
  }
}

export class ProjectError extends OrbitError {
  constructor(message = 'No project linked. Run `orbit init` in your project directory.') {
    super(message);
    this.name = 'ProjectError';
  }
}

export class ConfigError extends OrbitError {
  constructor(message = 'No config found. Run `orbit login` first.') {
    super(message);
    this.name = 'ConfigError';
  }
}
