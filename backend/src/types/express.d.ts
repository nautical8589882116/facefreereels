import 'express'

// Augment Express's own User type so `req.user` carries our JWT payload.
// (@types/passport already declares `Request.user?: User`; we only add fields.)
declare global {
  namespace Express {
    interface User {
      userId: string
      phone: string
    }
  }
}

export {}
