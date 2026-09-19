import { content } from '../../support/data/Chat.content';
import { expect, test } from '../../support/fixtures';

test.describe('Sign In', () => {
  test('The sign-in form is shown to a visitor with no session @Smoke', async ({ signInPage, chatPage }) => {
    // Act
    await signInPage.visit();

    // Assert - the chat is not reachable without signing in
    await signInPage.shouldBeLoaded();
    await expect(chatPage.container).toBeHidden();
  });

  test('A registered user can sign in and reach the chat @Smoke', async ({
    signInPage,
    chatPage,
    usersDataManager,
  }) => {
    // Arrange
    const user = await usersDataManager.create();
    await signInPage.visit();
    await signInPage.shouldBeLoaded();

    // Act
    await signInPage.signIn(user);

    // Assert
    await chatPage.shouldBeLoaded();
    await chatPage.shouldShowSignedInAs(user.email);
    await expect(signInPage.container).toBeHidden();
  });

  test('A wrong password shows an error and stays on the form @Smoke', async ({
    signInPage,
    chatPage,
    usersDataManager,
  }) => {
    // Arrange
    const user = await usersDataManager.create();
    await signInPage.visit();

    // Act
    await signInPage.signIn({ email: user.email, password: 'not-the-password' });

    // Assert
    await signInPage.shouldShowError(content.loginErrors.invalidCredentials);
    await expect(chatPage.container).toBeHidden();
    expect(await signInPage.storedToken()).toBeNull();
  });

  test('An unknown email gives the same error, revealing nothing @regression', async ({
    signInPage,
    usersDataManager,
  }) => {
    // Arrange
    await signInPage.visit();

    // Act
    await signInPage.signIn({ email: usersDataManager.uniqueEmail(), password: 'supersecret' });

    // Assert - identical to the wrong-password message, so accounts cannot be enumerated
    await signInPage.shouldShowError(content.loginErrors.invalidCredentials);
  });

  test('A visitor can register and is signed in straight away @Smoke', async ({
    signInPage,
    chatPage,
    usersDataManager,
  }) => {
    // Arrange
    const credentials = { email: usersDataManager.uniqueEmail(), password: 'supersecret' };
    await signInPage.visit();

    // Act
    await signInPage.register(credentials);

    // Assert
    await chatPage.shouldBeLoaded();
    await chatPage.shouldShowSignedInAs(credentials.email);

    const [created] = await usersDataManager.findByEmail(credentials.email);
    usersDataManager.track(created._id, credentials);
  });

  test('Registering an email that already exists shows an error @regression', async ({
    signInPage,
    chatPage,
    usersDataManager,
  }) => {
    // Arrange
    const user = await usersDataManager.create();
    await signInPage.visit();

    // Act
    await signInPage.register({ email: user.email, password: 'supersecret' });

    // Assert
    await signInPage.shouldShowError(content.loginErrors.emailTaken);
    await expect(chatPage.container).toBeHidden();
  });

  test('The session survives a reload @regression', async ({ signInPage, chatPage, usersDataManager }) => {
    // Arrange
    const user = await usersDataManager.create();
    await signInPage.visit();
    await signInPage.signIn(user);
    await chatPage.shouldBeLoaded();

    // Act
    await chatPage.reload();

    // Assert - the stored JWT is exchanged for a session on load
    await chatPage.shouldBeLoaded();
    await chatPage.shouldShowSignedInAs(user.email);
  });

  test('Signing out returns to the form and clears the session @Smoke', async ({
    signInPage,
    chatPage,
    usersDataManager,
  }) => {
    // Arrange
    const user = await usersDataManager.create();
    await signInPage.visit();
    await signInPage.signIn(user);
    await chatPage.shouldBeLoaded();

    // Act
    await chatPage.signOut();

    // Assert
    await signInPage.shouldBeLoaded();
    await expect(chatPage.container).toBeHidden();
    expect(await signInPage.storedToken()).toBeNull();

    // And a reload does not bring the session back
    await signInPage.reload();
    await signInPage.shouldBeLoaded();
  });

  test('The password field is masked @regression', async ({ signInPage }) => {
    await signInPage.visit();

    await signInPage.shouldMaskThePassword();
  });

  test('A stale token is rejected and the form is shown @regression', async ({ signInPage, chatPage }) => {
    // Arrange - a token that is not signed by this server
    await signInPage.visit();
    await signInPage.page.evaluate(() => {
      window.localStorage.setItem('feathers-jwt', 'not.a.jwt');
    });

    // Act
    await signInPage.reload();

    // Assert - reAuthenticate fails, so the visitor is asked to sign in
    await signInPage.shouldBeLoaded();
    await expect(chatPage.container).toBeHidden();
  });
});
