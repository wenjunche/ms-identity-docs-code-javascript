// Create the main myMSALObj instance

// configuration parameters are located at authConfig.js
const myMSALObj = new msal.PublicClientApplication(msalConfig);

let username = "";

/**
 * A promise handler needs to be registered for handling the
 * response returned from redirect flow. For more information, visit:
 * https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/dev/lib/msal-browser/docs/initialization.md#redirect-apis
 */
// myMSALObj.handleRedirectPromise()
//     .then(handleResponse)
//     .catch((error) => {
//         console.error(error);
//     });

async function init() {
    await myMSALObj.initialize();
    const response = await myMSALObj.handleRedirectPromise();
    handleResponse(response);
}

init();

function selectAccount() {

    /**
     * See here for more info on account retrieval: 
     * https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/dev/lib/msal-common/docs/Accounts.md
     */

    const currentAccounts = myMSALObj.getAllAccounts();

    if (!currentAccounts) {
        return;
    } else if (currentAccounts.length > 1) {
        // Add your account choosing logic here
        console.warn("Multiple accounts detected.");
        return currentAccounts[0];
    } else if (currentAccounts.length === 1) {
        username = currentAccounts[0].username
        welcomeUser(currentAccounts[0].username);
        updateTable(currentAccounts[0]);
        return currentAccounts[0];
    }
}

function handleResponse(response) {
    let activeAccount;
    /**
     * To see the full list of response object properties, visit:
     * https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/dev/lib/msal-browser/docs/request-response-object.md#response
     */

    if (response !== null) {
        username = response.account.username
        welcomeUser(username);
        updateTable(response.account);
        activeAccount = response.account;
    } else {
        activeAccount = selectAccount();

        /**
         * If you already have a session that exists with the authentication server, you can use the ssoSilent() API
         * to make request for tokens without interaction, by providing a "login_hint" property. To try this, comment the 
         * line above and uncomment the section below.
         */

        // myMSALObj.ssoSilent(silentRequest).
        //     then((response) => {
        //         welcomeUser(response.account.username);
        //         updateTable(response.account);
        //     }).catch(error => {
        //         console.error("Silent Error: " + error);
        //         if (error instanceof msal.InteractionRequiredAuthError) {
        //             signIn();
        //         }
        //     });
    }
    getAccessToken(activeAccount);
}

function signIn() {

    /**
     * You can pass a custom request object below. This will override the initial configuration. For more information, visit:
     * https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/dev/lib/msal-browser/docs/request-response-object.md#request
     */

    myMSALObj.loginRedirect(loginRequest);
}

function signOut() {

    /**
     * You can pass a custom request object below. This will override the initial configuration. For more information, visit:
     * https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/dev/lib/msal-browser/docs/request-response-object.md#request
     */

    // Choose which account to logout from by passing a username.
    const logoutRequest = {
        account: myMSALObj.getAccountByUsername(username),
        postLogoutRedirectUri: '/signout', // remove this line if you would like navigate to index page after logout.

    };

    myMSALObj.logoutRedirect(logoutRequest);
}

function getAccessToken(account) {
    if (account) {
        myMSALObj.acquireTokenSilent({...loginRequest, account}).then(response => {
            console.log('token response', response);
            const accessToken = response.accessToken;
            // sendEmail(accessToken);
        });
    } else {
        myMSALObj.loginRedirect(loginRequest);
    }
}

async function sendEmail(accessToken) {
    const email = {
        message: {
            subject: 'Hello from Vanilla JavaScript',
            body: {
                contentType: 'TEXT', // 'HTML',
                content: 'This is a test email sent from Vanilla JavaScript.'
            },
            toRecipients: [
                {
                emailAddress: {
                    address: 'wenjun@here.io'
                }
                }
            ]
        }
    };
    try {
      const response = await fetch('https://graph.microsoft.com/v1.0/me/sendMail', {
        method: "POST",
        headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(email),
      });
      console.log('Email sent successfully:', response.data);
    } catch (error) {
      console.error('Error sending email:', error);
    }
}