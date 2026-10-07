/** Safe to show to end users. Any other error is logged and replaced with a generic message. */
export class UserError extends Error {
  constructor(message: string, public status = 400) {
    super(message);
  }
}
