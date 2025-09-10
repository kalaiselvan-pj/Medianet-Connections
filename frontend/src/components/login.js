// import React, { useState } from 'react';
// import '../styles/login.css';
// import medianetLogo from '../assets/medianet-logo2.png';
// import { FaEnvelope, FaEye, FaEyeSlash } from 'react-icons/fa'; // import icons

// const Login = () => {
//   const [email, setEmail] = useState('');
//   const [password, setPassword] = useState('');
//   const [forgotPassword, setForgotPassword] = useState(false);
//   const [resetEmail, setResetEmail] = useState('');
//   const [showPassword, setShowPassword] = useState(false); // for toggling password visibility

//   const handleSubmit = (e) => {
//     e.preventDefault();
//     console.log('Email:', email, 'Password:', password);
//   };

//   const handleReset = (e) => {
//     e.preventDefault();
//     console.log('Reset link sent to:', resetEmail);
//     alert(`Reset link sent to: ${resetEmail}`);
//     setResetEmail('');
//     setForgotPassword(false);
//   };

//   return (
//     <div className="login-container">
//       <form onSubmit={forgotPassword ? handleReset : handleSubmit} className="login-form">
//         <img src={medianetLogo} alt="Medianet Logo" className="login-logo" />

//         {!forgotPassword ? (
//           <>
//             <h2>Welcome Back</h2>

//             <div className={`input-wrapper ${email ? 'filled' : ''}`}>
//               <FaEnvelope className="input-icon" />
//               <input
//               label="Outlined"
//                 type="email"
//                 placeholder="Email*"
//                 value={email}
//                 onChange={(e) => setEmail(e.target.value)}
//                 required
//               />
//             </div>

//             <div className={`input-wrapper ${password ? 'filled' : ''}`}>
//               <input
//                 type={showPassword ? 'text' : 'password'}
//                 placeholder="Password *"
//                 value={password}
//                 onChange={(e) => setPassword(e.target.value)}
//                 required
//               />
//               {showPassword ? (
//                 <FaEyeSlash className="input-icon password-icon" onClick={() => setShowPassword(false)} />
//               ) : (
//                 <FaEye className="input-icon password-icon" onClick={() => setShowPassword(true)} />
//               )}
//             </div>

//             <button type="submit">Login</button>
//             <p className="forgot-password" onClick={() => setForgotPassword(true)}>
//               Forgot Password?
//             </p>
//           </>
//         ) : (
//           <>
//             <h2>Forgot Password</h2>
//             <p>Enter your email address to receive a password reset link.</p>
//             <div className="input-wrapper">
//                 <label htmlFor="resetEmail" className="input-label">Email</label>
//               <FaEnvelope className="input-icon2" />
//               <input
//                 type="email"
//                 placeholder="Email"
//                 value={resetEmail}
//                 onChange={(e) => setResetEmail(e.target.value)}
//                 required
//               />
//             </div>
//             <button type="submit">Send Reset Link</button>
//             <p className="forgot-password" onClick={() => setForgotPassword(false)}>
//               Back to Login
//             </p>
//           </>
//         )}
//       </form>
//     </div>
//   );
// };

// export default Login;


import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/login.css';
import medianetLogo from '../assets/medianet-logo2.png';
import { FaEnvelope, FaEye, FaEyeSlash } from 'react-icons/fa';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [forgotPassword, setForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const navigate = useNavigate(); // for navigation after login

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Call backend API
    try {
      const response = await fetch('http://localhost:5000/statistics/login', { // replace with your API URL
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password }) // send email & password to backend
      });

      const data = await response.json();

      if (response.ok) {
        if (data.success) {
          // Login successful
          localStorage.setItem('token', data.token); // optional: save token
          navigate('/dashboard'); // redirect to Dashboard
        } else {
          alert('Invalid email or password');
        }
      } else {
        alert('Error: ' + data.message);
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Server error. Try again later.');
    }
  };

  const handleReset = (e) => {
    e.preventDefault();
    console.log('Reset link sent to:', resetEmail);
    alert(`Reset link sent to: ${resetEmail}`);
    setResetEmail('');
    setForgotPassword(false);
  };

  return (
    <div className="login-container">
      <form onSubmit={forgotPassword ? handleReset : handleSubmit} className="login-form">
        <img src={medianetLogo} alt="Medianet Logo" className="login-logo" />

        {!forgotPassword ? (
          <>
            <h2>Welcome Back</h2>

            <div className={`input-wrapper ${email ? 'filled' : ''}`}>
              <FaEnvelope className="input-icon" />
              <input
                type="email"
                placeholder="Email*"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className={`input-wrapper ${password ? 'filled' : ''}`}>
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Password *"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              {showPassword ? (
                <FaEyeSlash className="input-icon password-icon" onClick={() => setShowPassword(false)} />
              ) : (
                <FaEye className="input-icon password-icon" onClick={() => setShowPassword(true)} />
              )}
            </div>

            <button type="submit">Login</button>
            <p className="forgot-password" onClick={() => setForgotPassword(true)}>
              Forgot Password?
            </p>
          </>
        ) : (
          <>
            <h2>Forgot Password</h2>
            <p>Enter your email address to receive a password reset link.</p>
            <div className="input-wrapper">
              <label htmlFor="resetEmail" className="input-label">Email</label>
              <FaEnvelope className="input-icon2" />
              <input
                type="email"
                placeholder="Email"
                value={resetEmail}
                onChange={(e) => setResetEmail(e.target.value)}
                required
              />
            </div>
            <button type="submit">Send Reset Link</button>
            <p className="forgot-password" onClick={() => setForgotPassword(false)}>
              Back to Login
            </p>
          </>
        )}
      </form>
    </div>
  );
};

export default Login;
