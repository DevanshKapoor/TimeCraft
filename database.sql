-- Create users table first as it's referenced by courses
CREATE TABLE users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    role ENUM('student', 'professor') NOT NULL,
    batch VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create classrooms table before regular_timetable as it's referenced there
CREATE TABLE classrooms (
    id INT PRIMARY KEY AUTO_INCREMENT,
    room_number VARCHAR(20) UNIQUE NOT NULL,
    capacity INT NOT NULL,
    building VARCHAR(50)
);

-- Create courses table after users as it references users
CREATE TABLE courses (
    id INT PRIMARY KEY AUTO_INCREMENT,
    course_code VARCHAR(20) UNIQUE NOT NULL,
    course_name VARCHAR(100) NOT NULL,
    professor_id INT,
    FOREIGN KEY (professor_id) REFERENCES users(id)
);

-- Create regular_timetable after courses and classrooms
CREATE TABLE regular_timetable (
    id INT PRIMARY KEY AUTO_INCREMENT,
    course_id INT,
    batch VARCHAR(50) NOT NULL,
    day_of_week INT NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    classroom_id INT,
    FOREIGN KEY (course_id) REFERENCES courses(id),
    FOREIGN KEY (classroom_id) REFERENCES classrooms(id)
);

-- Create modified_classes last as it references regular_timetable
CREATE TABLE modified_classes (
    id INT PRIMARY KEY AUTO_INCREMENT,
    regular_class_id INT,
    modification_type ENUM('cancelled', 'postponed') NOT NULL,
    new_date DATE,
    new_start_time TIME,
    new_end_time TIME,
    new_classroom_id INT,
    valid_until DATE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (regular_class_id) REFERENCES regular_timetable(id),
    FOREIGN KEY (new_classroom_id) REFERENCES classrooms(id)
);
