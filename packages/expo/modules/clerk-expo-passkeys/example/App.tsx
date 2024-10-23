import { ClerkProvider, SignedIn, SignedOut, useAuth, useSignIn, useUser } from '@clerk/clerk-expo';
import { passkeys } from 'clerk-expo-passkeys';
import * as SecureStore from 'expo-secure-store';
import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity, TextInput } from 'react-native';

const tokenCache = {
  async getToken(key: string) {
    try {
      const item = await SecureStore.getItemAsync(key);
      if (item) {
        console.log(`${key} was used 🔐 \n`);
      } else {
        console.log('No values stored under key: ' + key);
      }
      return item;
    } catch (error) {
      console.error('SecureStore get item error: ', error);
      await SecureStore.deleteItemAsync(key);
      return null;
    }
  },
  async saveToken(key: string, value: string) {
    try {
      return SecureStore.setItemAsync(key, value);
    } catch (err) {
      console.log(err);
    }
  },
};

const ProtectedView = () => {
  const { user: clerkUser } = useUser();
  const auth = useAuth();

  const handleCreatePasskey = async () => {
    if (!clerkUser) return;
    try {
      return await clerkUser.createPasskey();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <View style={styles.protectedContainer}>
      <TouchableOpacity onPress={handleCreatePasskey}>
        <Text>Create passkey</Text>
      </TouchableOpacity>
      <TouchableOpacity
        onPress={() => {
          auth.signOut();
        }}
      >
        <Text>Sign out</Text>
      </TouchableOpacity>
      {clerkUser && (
        <View>
          <Text style={{ color: 'cyan' }}>
            User with id <Text style={styles.italic}>{clerkUser.id}</Text> and Username{' '}
            <Text style={styles.userInfo}>{clerkUser.primaryEmailAddress?.toString()}</Text> is logged in{' '}
          </Text>
        </View>
      )}
    </View>
  );
};

const PublicView = () => {
  const { signIn, setActive, isLoaded } = useSignIn();

  const [emailAddress, setEmailAddress] = React.useState('');
  const [password, setPassword] = React.useState('');

  const handleSignIn = async (method: 'password' | 'passkey') => {
    if (!isLoaded) return;

    try {
      let signInResponse;
      if (method === 'password') {
        signInResponse = await signIn.create({
          identifier: emailAddress,
          password,
        });
      } else {
        signInResponse = await signIn.authenticateWithPasskey({
          flow: 'discoverable',
        });
      }
      await setActive({ session: signInResponse.createdSessionId });
    } catch (err: any) {
      console.error(err.clerkError ? err.errors[0].longMessage : err);
    }
  };

  return (
    <View style={styles.publicContainer}>
      <View>
        <TextInput
          autoCapitalize='none'
          value={emailAddress}
          placeholder='Email...'
          textContentType='username'
          onChangeText={emailAddress => setEmailAddress(emailAddress)}
        />
      </View>

      <View>
        <TextInput
          value={password}
          placeholder='Password...'
          textContentType='password'
          onChangeText={password => setPassword(password)}
        />
      </View>

      <TouchableOpacity onPress={() => handleSignIn('password')}>
        <Text>Sign in</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => handleSignIn('passkey')}>
        <Text>Sign in with passkey</Text>
      </TouchableOpacity>
    </View>
  );
};

export default function App() {
  const publishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY!;

  return (
    <ClerkProvider
      publishableKey={publishableKey}
      tokenCache={tokenCache}
      passkeysFunc={passkeys}
    >
      <View style={styles.container}>
        <SignedIn>
          <ProtectedView />
        </SignedIn>
        <SignedOut>
          <PublicView />
        </SignedOut>
      </View>
    </ClerkProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  protectedContainer: {
    gap: 12,
    flex: 1,
    justifyContent: 'center',
    backgroundColor: '#1D3D47',
    padding: 20,
  },
  publicContainer: {
    marginTop: 100,
    marginLeft: 10,
    gap: 15,
  },
  input: {
    // Add input styles
  },
  userInfo: {
    color: 'cyan',
  },
  italic: {
    fontStyle: 'italic',
  },
});
