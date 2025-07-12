# Web application for digital product designers
Designers often rely on different services for searching, generating, and editing images. This project is designed as a single platform that brings all these features together and adds social capabilities for user interaction.
## ⚙️ Tech Stack
* **Frontend**: React, React Router, Tailwind CSS, Axios
* **Backend**: Node.js, Express, MongoDB (Mongoose), Passport (JWT, OAuth)
* **Storage**: AWS S3, Multer
* **AI Services**: OpenAI DALLE, RemoveBg
* **Auth & Security**: JWT, OAuth (Google, GitLab), CSRF, bcrypt, HTTPS
* **Email**: Nodemailer (SMTP)
## 🏛️ System architecture
The application is implemented using a client-server model with REST API. Separation of the frontend and backend ensures scalability and clean architecture.
### High level diagram
![High level Diagram](https://i.imgur.com/jLcyIFo.png)
This diagram provides an overview of the application's architecture. It illustrates the separation between the React-based frontend and the Node.js/Express backend, connected via a REST API. Data is stored in MongoDB with additional storage on AWS S3. Security components like JWT, CSRF protection, HTTPS, and bcrypt are highlighted separately. The system also integrates with external services such as OAuth 2.0 providers, SMTP for email notifications, and AI APIs like OpenAI DALLE and RemoveBg. The design emphasizes clear separation of concerns, scalability, and secure integration with third-party services.
* Detailed [Backend](https://i.imgur.com/ZVETIJa.png) and [Frontend](https://i.imgur.com/xR6Oyvw.png) component diagrams
* Detailed [Activity](https://i.imgur.com/HeoDH5d.png) diagram
### Database diagram
![Database Diagram](https://i.imgur.com/MhrDqyX.png)
Shows the main application entities and their relationships. The User model includes profile and authentication data (including OAuth), can create posts with images and tags, and write comments. 
There's also a Message model for direct user-to-user communication.
##   🤖 Integrations and external services
* **OpenAI DALLE**: image generation using prompt
* **RemoveBg**: background removal
* **OAuth 2.0**: Google and GitLab authentification
* **SMTP (Nodemailer)**: email-notifications
## 🔐 Security
* JWT (access/refresh) tokens
* CSRF protection via middleware
* HTTPS
* Bcrypt password hashing
* Rate limiting
* Input validation
##   🎥 Video preview
Click the image to watch the video on YouTube
[![Watch the video](https://i.imgur.com/ZX4kTjv.png
)](https://youtu.be/csnbDayisCc)
