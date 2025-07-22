# TimeCraft – Timetable Management App

A comprehensive timetable management system built for educational institutions, enabling students and professors to view, manage, and interact with class schedules in real-time.

---

## Overview

TimeCraft streamlines academic scheduling by offering a dynamic and user-friendly interface tailored for both students and professors. With features like real-time updates, class cancellation/postponement, and weekly schedule modifications, TimeCraft helps institutions efficiently manage their timetables.

---

## Features

### User Authentication
- Secure registration and login
- JWT-based authentication
- Password hashing with Bcrypt
- Role-based access: **Students** and **Professors**

### Timetable Management

#### Student Features
- View personal class schedules
- Receive real-time updates on changes
- Track class cancellations and postponements

#### Professor Features
- View personal timetable
- Cancel or postpone classes
- Reschedule with:
  - Alternative time slots
  - Available classroom selection

### Unique Functionalities
- Temporary weekly modifications
- Classroom availability tracking
- Auto-reversion to original schedule after a week

---

## Technology Stack

### Frontend
- **React (Vite)**
- React Router
- State Management: Redux or Context API
- Axios for HTTP requests
- Tailwind CSS

### Backend
- **Node.js** with **Express.js**
- JWT for auth, Bcrypt for password security
- RESTful API structure

### Database
- **MySQL**
- Sequelize ORM

### Other Tools
- Moment.js for date/time manipulation

---

## Prerequisites

- Node.js (v16+)
- npm or Yarn
- MySQL Server

---

## 📦 Installation and Setup

### 🔁 Clone the Repository

```bash
git clone https://github.com/DevanshKapoor/TimeCraft.git
cd timetable-management-app
```

### 📂 Backend Setup

```bash
cd backend
npm install
```

Create a `.env` file with the following:
```env
DB_HOST=localhost
DB_USER=your_mysql_username
DB_PASSWORD=your_mysql_password
DB_NAME=timetable_db
JWT_SECRET=your_jwt_secret
```

**Setup Database**

```bash
npm run db:migrate
npm run db:seed
```

**Start Backend Server**

```bash
npm start
```

### 🌐 Frontend Setup

```bash
cd ../frontend
npm install
```

Create a `.env` file:

```env
VITE_API_ENDPOINT=http://localhost:5000/api
```

**Start Development Server**

```bash
npm run dev
```

---

## 🔗 API Endpoints

| Endpoint | Description |
|----------|-------------|
| `POST /auth/register` | User registration |
| `POST /auth/login` | User login |
| `GET /timetable` | Fetch timetable |
| `POST /classes/cancel` | Cancel a class |
| `POST /classes/postpone` | Postpone/reschedule a class |

---

## Security Considerations

- JWT-based secure authentication
- Password hashing with Bcrypt
- Role-based access control
- Input sanitization and validation
- CORS enabled and protected

---

## Contribution Guidelines

1. Fork the repository
2. Create a new feature branch
3. Commit your changes
4. Push to your branch
5. Open a Pull Request

---

## Future Roadmap

- 📱 Mobile responsiveness
- ✉️ Email/SMS notifications
- 📊 Advanced timetable analytics
- 🔗 Integration with LMS platforms

---

## License

This project is licensed under the **MIT License**.

---

## Contact

For suggestions or queries, feel free to contact:

**Devansh Kapoor**  
📧 [kapoordevansh15@gmail.com]  
