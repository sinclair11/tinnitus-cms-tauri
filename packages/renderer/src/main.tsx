import React from 'react';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from '@src/App';
import reduxPersist from './store/reducers/persist';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';

// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
const root = createRoot(document.getElementById('root')!);
// Application to Render
const app = <App title="Tinnitus CMS" version="1.0.0" />;
const persist = reduxPersist();

root.render(
    <StrictMode>
        <Provider store={persist.store}>
            <PersistGate loading={null} persistor={persist.persistor}>
                {app}
            </PersistGate>
        </Provider>
    </StrictMode>,
);

window.removeLoading();
