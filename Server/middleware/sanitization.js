const DOMPurify = require('isomorphic-dompurify');

// HTML sanitization middleware for email templates and content
const sanitizeHTML = (html) => {
  if (!html || typeof html !== 'string') {
    return html;
  }

  // Configure DOMPurify to allow common email HTML tags but remove dangerous ones
  const cleanHTML = DOMPurify.sanitize(html, {
    ALLOWED_TAGS: [
      'p', 'br', 'strong', 'b', 'em', 'i', 'u', 'a', 'img', 'div', 'span',
      'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'ul', 'ol', 'li', 'table', 'tr',
      'td', 'th', 'thead', 'tbody', 'tfoot', 'blockquote', 'pre', 'code'
    ],
    ALLOWED_ATTR: [
      'href', 'src', 'alt', 'title', 'width', 'height', 'style', 'class',
      'target', 'rel', 'border', 'cellpadding', 'cellspacing'
    ],
    ALLOWED_URI_REGEXP: /^(?:(?:(?:f|ht)tps?|mailto|tel|callto|cid|xmpp):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i,
    FORBID_TAGS: ['script', 'object', 'embed', 'form', 'input', 'button'],
    FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover', 'onfocus', 'onblur']
  });

  return cleanHTML;
};

// Middleware function for Express routes
const sanitizeEmailContent = (req, res, next) => {
  try {
    // Sanitize email content fields
    if (req.body.content) {
      req.body.content = sanitizeHTML(req.body.content);
    }

    // Sanitize email template content
    if (req.body.html_content) {
      req.body.html_content = sanitizeHTML(req.body.html_content);
    }

    // Sanitize subject (remove any HTML tags)
    if (req.body.subject) {
      req.body.subject = DOMPurify.sanitize(req.body.subject, { ALLOWED_TAGS: [] });
    }

    next();
  } catch (error) {
    console.error('HTML sanitization error:', error);
    res.status(400).json({
      success: false,
      error: 'Invalid HTML content',
      message: 'Content contains unsafe HTML that cannot be processed'
    });
  }
};

// Validate and sanitize personalization tokens
const validatePersonalizationTokens = (content) => {
  if (!content || typeof content !== 'string') {
    return { isValid: true, sanitized: content };
  }

  // Allow only safe personalization tokens
  const allowedTokens = [
    'first_name', 'last_name', 'full_name', 'name', 'email', 
    'company', 'phone', 'status'
  ];

  const tokenRegex = /\{\{([^}]+)\}\}/g;
  let match;
  const foundTokens = [];

  while ((match = tokenRegex.exec(content)) !== null) {
    const token = match[1].trim().toLowerCase();
    foundTokens.push(token);
    
    if (!allowedTokens.includes(token)) {
      return {
        isValid: false,
        error: `Invalid personalization token: {{${match[1]}}}`
      };
    }
  }

  return { isValid: true, sanitized: content, tokens: foundTokens };
};

module.exports = {
  sanitizeHTML,
  sanitizeEmailContent,
  validatePersonalizationTokens
};
