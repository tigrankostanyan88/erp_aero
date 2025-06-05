const bcrypt = require('bcryptjs');
const crypto = require('crypto');

module.exports = (con, DataTypes) => {
    const User = con.define('users', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
            allowNull: false
        },
         name: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        email: {
            type: DataTypes.STRING,
            allowNull: false,
            validate: {
                isEmail: {
                    msg: 'Email is incorrect!'
                }
            }
        },
        password: {
            type: DataTypes.TEXT,
            allowNull: false,
        },
        passwordChangedAt: DataTypes.DATE,
        passwordResetToken: DataTypes.STRING,
        passwordResetExpires: DataTypes.DATE,
        role: {
            type: DataTypes.ENUM,
            values: ['user', 'admin'],
            defaultValue: 'admin'
        },
        date: {
            type: DataTypes.DATE,
            defaultValue: con.literal("CURRENT_TIMESTAMP"),
            allowNull: false
        },
        deleted: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false
        },
    }, {
        indexes: [{
            unique: true,
            fields: ['email']
        }],
        hooks: {
            beforeCreate: async (user, options) => {
                const hashedPassword = await bcrypt.hash(user.password, 10);
                user.password = hashedPassword;
                user.passwordConfirm = hashedPassword;
            },
            beforeUpdate: async (user, options) => {
                if (user.changed('password')) {
                    const hashedPassword = await bcrypt.hash(user.password, 10);
                    user.password = hashedPassword;
                    user.passwordConfirm = hashedPassword;
                    user.passwordChangedAt = Date.now() - 1000;

                    // Reset Token
                    if (user.passwordResetToken) {
                        user.passwordResetToken = null;
                        user.passwordResetExpires = null;
                    }
                }
            },
            beforeFind: async (query) => {
                if (query) {
                    if (query.where === undefined) {
                        query.where = {}
                    }
                    // if not defined
                    if (query.where.deleted === undefined) {
                        // only not deleted users
                        query.where.deleted = false;
                    }
                }
            },
        }
    });

    User.prototype.changedPasswordAfter = function (JWTTimestamp) {
        if (this.passwordChangedAt) {
            const changedTimestamp = Math.floor(this.passwordChangedAt.getTime() / 1000);
            return JWTTimestamp < changedTimestamp;
        }
        return false;
    }

    User.prototype.correctPassword = async function (candidatePassword, userPassword) {
        return await bcrypt.compare(candidatePassword, userPassword);
    }

    User.prototype.createPasswordResetToken = function () {
        const resetToken = crypto.randomBytes(20).toString('hex');

        this.passwordResetToken = crypto.createHash('sha256').update(resetToken).digest('hex');

        this.passwordResetExpires = Date.now() + (10 * 60 * 1000); // 10 minutes

        return resetToken;
    };
    return User;
}