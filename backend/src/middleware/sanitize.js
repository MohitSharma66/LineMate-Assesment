const sanitizeHtml = require('sanitize-html');

// Middleware to sanitize all string fields in request body
const sanitizeInput = (req, res, next) => {
  if (req.body) {
    for (let key in req.body) {
      if (typeof req.body[key] === 'string') {
        req.body[key] = sanitizeHtml(req.body[key], {
          allowedTags: [], // Strip all HTML tags
          allowedAttributes: {},
          textFilter: function(text) {
            // Additional sanitization
            return text.replace(/[<>]/g, '');
          }
        });
      }
    }
  }
  next();
};

// Specific sanitization for event creation
const sanitizeEventInput = (req, res, next) => {
  if (req.body.description) {
    req.body.description = sanitizeHtml(req.body.description, {
      allowedTags: ['p', 'br', 'b', 'i', 'em', 'strong'],
      allowedAttributes: {}
    });
  }
  next();
};

module.exports = { sanitizeInput, sanitizeEventInput };