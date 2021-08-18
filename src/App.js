import logo from './logo.svg';
import './App.css';
import awsconfig from './aws-exports';
import {AmplifySignIn, AmplifyAuthenticator} from '@aws-amplify/ui-react'
import Amplify from 'aws-amplify';
import MainComponent from './Components/MainComponent';
import { useEffect, useState } from 'react';
import {AuthState, onAuthUIStateChange} from '@aws-amplify/ui-components';
const cfnOutput = require("./cfn-output.json");

Amplify.configure(awsconfig);

function App() {

  const [authState, setAuthState] = useState();
  const [user, setUser] = useState();

  useEffect(() => {
    return onAuthUIStateChange((nextAuthState, authData) => {
      setAuthState(nextAuthState);
      setUser(authData);
    })
  }, []);

  const component = (authState === AuthState.SignedIn && user ? <MainComponent /> : <AmplifyAuthenticator><AmplifySignIn slot="sign-in" hideSignUp></AmplifySignIn></AmplifyAuthenticator>);

  return component;
}

export default App;
