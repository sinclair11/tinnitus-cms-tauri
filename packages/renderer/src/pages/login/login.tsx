import React, { useState } from 'react';
import { InputGroup, FormControl, Button, Form } from 'react-bootstrap';
import logo from '@icons/logo.png';
import { useNavigate } from 'react-router-dom';
import { getAuth, signInWithEmailAndPassword, setPersistence, browserSessionPersistence } from 'firebase/auth';
import { app, db } from '@config/firebase';
import { useDispatch } from 'react-redux';
import { doc, getDoc } from 'firebase/firestore';
import { getStorage, ref, getBlob } from 'firebase/storage';

const Login: React.FC = () => {
    const dispatch = useDispatch();
    const [admin, setAdmin] = useState('');
    const [passw, setPassw] = useState('');
    const [adminInvalid, setAdminInvalid] = useState('');
    const [passwInvalid, setPasswInvalid] = useState('');
    const navigate = useNavigate();
    const auth = getAuth(app);

    async function AuthAdmin(): Promise<void> {
        let isValid = 0;

        //Show loading screen
        window.appendLoading();

        if (admin === '') {
            setAdminInvalid('Field must not be empty');
            isValid++;
        } else {
            setAdminInvalid('');
        }

        if (passw === '') {
            setPasswInvalid('Field must not be empty');
            isValid++;
        } else {
            setPasswInvalid('');
        }

        if (isValid === 0) {
            //Send authentication request
            try {
                await setPersistence(auth, browserSessionPersistence);
                //Login in firebase
                await signInWithEmailAndPassword(getAuth(), admin, passw);
                dispatch({
                    type: 'general/auth',
                    payload: getAuth().currentUser!.uid,
                });
                //Get config from db
                await fetchConfig();
                //Get config files
                // await getConfigFromStorage();
                //Init OCI client provider
                await window.electron.initProvider();
                window.removeLoading();
                setAdmin('');
                setPassw('');
                navigate('/');
            } catch (error: any) {
                //Handle error and display message
                setAdmin('');
                setPassw('');
                window.removeLoading();
                window.electron.showErrorMessage(error.message);
            }
        } else {
            /*Do nothing*/
        }
    }

    async function fetchConfig(): Promise<void> {
        try {
            //Retrieve oci configuration from database
            let docSnap = await getDoc(doc(db, 'misc', 'config'));
            const ociConfig = docSnap.data()!;
            dispatch({
                type: 'oci/config',
                payload: {
                    fingerprint: ociConfig.oci_fingerprint,
                    host: ociConfig.oci_host,
                    tenancy: ociConfig.oci_tenancy,
                    id: ociConfig.oci_id,
                    namespace: ociConfig.oci_namespace,
                    prereq: ociConfig.oci_prereq,
                },
            });
            docSnap = await getDoc(doc(db, 'misc', 'albums'));
            const albumsConfig = docSnap.data()!;
            dispatch({
                type: 'general/categories',
                payload: albumsConfig.categories,
            });
        } catch (error) {
            throw error;
        }
    }

    async function getConfigFromStorage(): Promise<void> {
        try {
            if ((await window.electron.isKeyAvailable()) === false) {
                const storage = getStorage();
                //Fetch config file
                const configRef = ref(storage, 'config');
                const configFile = await getBlob(configRef);
                //Fetch key file
                const keyRef = ref(storage, 'oci_api_key.pem');
                const keyFile = await getBlob(keyRef);
                //Transfer to main OCI service
                await window.electron.provideKey(await keyFile.text(), await configFile.text());
            }
        } catch (error: any) {
            throw error;
        }
    }

    return (
        <div className="PageLogin">
            <img src={logo} className="LogoLogin" />
            <Form noValidate className="LoginForm">
                <div className="InputSection" style={{ height: '55px' }}>
                    <InputGroup className="InputGroupPath" hasValidation>
                        <FormControl
                            required
                            placeholder="email"
                            className="LoginInput"
                            value={admin}
                            onChange={(e: any): void => {
                                setAdmin(e.target.value);
                                setAdminInvalid('');
                            }}
                        />
                    </InputGroup>
                    <p className="InvalidRed" style={{ marginTop: '2px' }}>
                        {adminInvalid}
                    </p>
                </div>
                <div className="InputSection" style={{ height: '55px' }}>
                    <InputGroup className="InputGroupPath" hasValidation>
                        <FormControl
                            required
                            type="password"
                            placeholder="password"
                            className="LoginInput"
                            value={passw}
                            onChange={(e: any): void => {
                                setPassw(e.target.value);
                                setPasswInvalid('');
                            }}
                        />
                    </InputGroup>
                    <p className="InvalidRed" style={{ marginTop: '2px' }}>
                        {passwInvalid}
                    </p>
                </div>
                <Button onClick={AuthAdmin} className="LoginBtn">
                    Login
                </Button>
            </Form>
            <p className="Copyright">© 2022 Tinnitus Sounds</p>
        </div>
    );
};

export default Login;
