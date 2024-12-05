export class LimitationExceedException extends Error {
  constructor(message: string) {
    super(message);
    this.name = LimitationExceedException.name;
  }
}