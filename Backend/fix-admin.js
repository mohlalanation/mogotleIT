const bcrypt = require('bcryptjs');
const db = require('./db');

const PASSWORD = 'admin123';

bcrypt.hash(PASSWORD, 10, (err, hash) => {
    if (err) {
        console.log('❌ bcrypt error:', err.message);
        process.exit(1);
    }

    console.log('Generated hash:', hash);

    // Delete any existing admin first
    db.query("DELETE FROM admins WHERE username = 'admin'", (err) => {
        if (err) {
            console.log('❌ Delete error:', err.message);
            process.exit(1);
        }

        // Insert new admin
        db.query(
            "INSERT INTO admins (username, password_hash) VALUES ('admin', ?)",
            [hash],
            (err, result) => {
                if (err) {
                    console.log('❌ Insert error:', err.message);
                    process.exit(1);
                }
                console.log('✅ SUCCESS! Admin created in database.');
                console.log('   → Username: admin');
                console.log('   → Password: admin123');
                process.exit(0);
            }
        );
    });
});