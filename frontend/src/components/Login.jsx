// import React, { useState } from 'react';
// import axios from 'axios';
// import '../css/Login.css'; 

// const Login = ({ onLogin }) => {
//   const [formData, setFormData] = useState({ username: '', password: '' });
//   const [message, setMessage] = useState('');

//   const handleChange = e => {
//     setFormData({ ...formData, [e.target.name]: e.target.value });
//   };

//   const handleSubmit = async e => {
//     e.preventDefault();
//     try {
//       const res = await axios.post('http://localhost:8080/api/auth/login', formData);
//       // Giả sử backend trả user info
//       localStorage.setItem('user', JSON.stringify(res.data));
//       setMessage('Đăng nhập thành công!');
//       onLogin(res.data);
//     } catch (err) {
//       setMessage(err.response?.data?.message || 'Đăng nhập thất bại');
//     }
//   };

//   return (
//     <div className="login">
//       <h2>Đăng nhập</h2>
//       <form onSubmit={handleSubmit} className="login__form">
//         <label>Username:</label>
//         <input type="text" name="username" value={formData.username} onChange={handleChange} required />

//         <label>Password:</label>
//         <input type="password" name="password" value={formData.password} onChange={handleChange} required />

//         <button type="submit">Đăng nhập</button>
//       </form>
//       {message && <p className="login__message">{message}</p>}
//     </div>
//   );
// };

// export default Login;
