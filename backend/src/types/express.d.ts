// Augment Express' own Request with the authenticated principal that
// `authenticate` attaches. This must NOT reference AuthRequest: AuthRequest
// extends Request, so `interface Request extends AuthRequest` is circular and
// collapses Request to just its augmented members (losing query/body/params).

declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string
        phone: string
      }
    }
  }
}

export {}
