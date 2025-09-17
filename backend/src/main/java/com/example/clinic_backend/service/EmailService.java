// import org.springframework.mail.javamail.JavaMailSender;
// import org.springframework.mail.javamail.MimeMessageHelper;
// import org.springframework.stereotype.Service;

// import jakarta.mail.MessagingException;
// import jakarta.mail.internet.MimeMessage;

// @Service
// public class EmailService {

//     private final JavaMailSender mailSender;

//     public EmailService(JavaMailSender mailSender) {
//         this.mailSender = mailSender;
//     }

//     public void sendRegistrationEmail(String toEmail, String fullName) {
//         try {
//             MimeMessage message = mailSender.createMimeMessage();
//             MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

//             helper.setTo(toEmail);
//             helper.setSubject("Chào mừng " + fullName + " đến với hệ thống đặt khám");
//             helper.setText(
//                     "<h2>Xin chào " + fullName + "!</h2>"
//                             + "<p>Bạn đã đăng ký tài khoản thành công tại <b>Hệ thống đăng ký khám bệnh trực tuyến</b>.</p>"
//                             + "<p>Hãy đăng nhập và trải nghiệm dịch vụ của chúng tôi.</p>"
//                             + "<br/>"
//                             + "<a href='http://localhost:5173/login' "
//                             + "style='padding:10px 20px; background:#4CAF50; color:#fff; text-decoration:none; border-radius:5px;'>"
//                             + "Đăng nhập ngay</a>",
//                     true);

//             mailSender.send(message);

//         } catch (MessagingException e) {
//             throw new RuntimeException("Không thể gửi email", e);
//         }
//     }
// }
