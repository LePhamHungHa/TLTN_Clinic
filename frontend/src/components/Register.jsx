// import React, { useState } from 'react';
// import axios from 'axios';
// import '../css/Register.css'; 

// const Register = () => {
//   const [formData, setFormData] = useState({
//     username: '',
//     email: '',
//     password: '',
//     avatar_url: ''
//   });

//   const [message, setMessage] = useState('');

//   const handleChange = e => {
//     setFormData({ ...formData, [e.target.name]: e.target.value });
//   };

//   const handleSubmit = async e => {
//     e.preventDefault();
//     try {
//       const res = await axios.post('http://localhost:8080/api/auth/register', formData);
//     console.log(res.data); // dùng dữ liệu để tránh ESLint cảnh báo
//     setMessage('Đăng ký thành công!');
      
//     } catch (err) {
//       setMessage(err.response?.data?.message || 'Đăng ký thất bại');
//     }
//   };

//   return (
//     <div className="register">
//       <h2>Đăng ký</h2>
//       <form onSubmit={handleSubmit} className="register__form">
//         <label>Username:</label>
//         <input type="text" name="username" value={formData.username} onChange={handleChange} required />

//         <label>Email:</label>
//         <input type="email" name="email" value={formData.email} onChange={handleChange} required />

//         <label>Password:</label>
//         <input type="password" name="password" value={formData.password} onChange={handleChange} required />

//         <label>Avatar URL:</label>
//         <input type="text" name="avatar_url" value={formData.avatar_url} onChange={handleChange} />

//         <button type="submit">Đăng ký</button>
//       </form>
//       {message && <p className="register__message">{message}</p>}
//     </div>
//   );
// };

// export default Register;
