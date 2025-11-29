import { Request, Response, NextFunction } from 'express';

export function flashMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  // Initialize flash in locals
  res.locals.flash = {
    success: [],
    error: [],
    info: [],
  };

  // Copy flash messages from session to locals
  if (req.session.flash) {
    res.locals.flash = {
      success: req.session.flash.success || [],
      error: req.session.flash.error || [],
      info: req.session.flash.info || [],
    };
    // Clear flash after reading
    delete req.session.flash;
  }

  // Helper function to add flash messages
  res.locals.setFlash = (type: 'success' | 'error' | 'info', message: string) => {
    if (!req.session.flash) {
      req.session.flash = {};
    }
    if (!req.session.flash[type]) {
      req.session.flash[type] = [];
    }
    req.session.flash[type]!.push(message);
  };

  next();
}
