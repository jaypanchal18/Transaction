import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';

function VerifyEmail() {
    const { token } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [verified, setVerified] = useState(false); // State to show success message

    useEffect(() => {
        const verifyEmail = async () => {
            try {
                console.log(`Verifying email with token: ${token}`);
                const response = await axios.get(`http://localhost:5000/verify/${token}`);
                if (response.status === 200) {
                    setLoading(false);
                    setVerified(true); 
                } else {
                    setLoading(false);
                }
            } catch (error) {
                console.error('Error verifying email:', error.response ? error.response.data : error.message);
                setLoading(false); 
            }
        };

        verifyEmail();
    }, [token]);

    return (
        <div style={styles.container}>
            {loading && (
                <div style={styles.spinnerContainer}>
                    <div style={styles.spinner}></div>
                    <p style={styles.loadingText}>Verifying your email...</p>
                </div>
            )}
            {verified && (
                <div style={styles.card}>
                    <h1 style={styles.headerText}>Your email has been verified</h1>
                    <p style={styles.normalText}>
                        Congratulations! Your email address has been verified successfully.
                    </p>
                    <button style={styles.button} onClick={() => navigate('/login')}>
                        Go to Login
                    </button>
                </div>
            )}
        </div>
    );
}

const styles = {
    container: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        backgroundColor: '#F0F4F8',
    },
    card: {
        textAlign: 'center',
        backgroundColor: '#ffffff',
        padding: '20px',
        borderRadius: '8px',
        boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
    },
    headerText: {
        marginTop: '20px',
        color: '#333',
    },
    normalText: {
        color: '#666',
        marginBottom: '20px',
    },
    button: {
        backgroundColor: '#0052cc',
        color: '#ffffff',
        border: 'none',
        borderRadius: '4px',
        padding: '10px 20px',
        cursor: 'pointer',
        fontSize: '16px',
    },
    spinnerContainer: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
    },
    spinner: {
        border: '6px solid #f3f3f3', /* Light grey */
        borderTop: '6px solid #0052cc', /* Blue */
        borderRadius: '50%',
        width: '40px',
        height: '40px',
        animation: 'spin 1s linear infinite',
    },
    loadingText: {
        marginTop: '10px',
        color: '#666',
    }
};

// Keyframes for spinner animation
const styleSheet = document.styleSheets[0];
const keyframes = `
@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
`;
styleSheet.insertRule(keyframes, styleSheet.cssRules.length);

export default VerifyEmail;
