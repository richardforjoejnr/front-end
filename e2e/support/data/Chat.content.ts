/**
 * Copy the tests assert on. Keeping it here means a wording change is a one-line edit
 * rather than a search across every spec.
 */
export const content = {
  en: {
    title: 'Welcome to Feathers',
    messagesTitle: 'Messages',
    sendButton: 'Send',
    deleteButtonLabel: 'Delete message',
    signInButton: 'Sign in',
    registerButton: 'Register',
    signOutButton: 'Sign out',
  },
  loginErrors: {
    invalidCredentials: 'Invalid email or password',
    missingFields: 'Enter an email and password to register',
    emailTaken: 'That email is already registered',
  },
  errors: {
    notFound: 'NotFound',
    badRequest: 'BadRequest',
  },
};

/** Text that would execute if the page ever rendered message text as HTML. */
export const xssPayload = '<img src=x onerror="document.title=\'xss\'"><b>bold?</b>';
