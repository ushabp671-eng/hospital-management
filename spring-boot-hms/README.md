# MercyCare Hospital Management System (Java Spring Boot + MySQL + Bootstrap)

## Prerequisites
- Java 17+ (JDK 17 or 21)
- Maven 3.9+
- MySQL 8.0+
- IntelliJ IDEA or Eclipse IDE

## 1. MySQL Database Setup
1. Start your local MySQL server.
2. Run the schema script in MySQL Workbench or CLI:
   ```bash
   mysql -u root -p < src/main/resources/schema.sql
   mysql -u root -p < src/main/resources/data.sql
   ```
3. Update `src/main/resources/application.properties` with your MySQL username and password.

## 2. Running in IntelliJ IDEA / Eclipse
1. Open **File -> Open** (IntelliJ) or **Import -> Existing Maven Projects** (Eclipse) and select the `spring-boot-hms` folder.
2. Wait for Maven dependencies (`spring-boot-starter-web`, `spring-boot-starter-data-jpa`, `mysql-connector-j`) to download.
3. Run `HospitalManagementApplication.java` as a Java Application.
4. Open `http://localhost:8080` and sign in with `admin` / `Admin@123`.

## 3. Running via Maven CLI
```bash
cd spring-boot-hms
mvn spring-boot:run
```
