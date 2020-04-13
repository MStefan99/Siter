#!/bin/sh

echo "Please enter username for your new user:"
while true; do
	read -r username
	if [ -z "$username" ]; then
		echo "Username cannot be empty! Please enter new username:"
	else
		break
	fi
done
code=$(tr -dc 'A-Za-z0-9' </dev/urandom | head -c 32)

sqlite3 ./database/users.sqlite "
	insert into users(username, setup_code)
	values ('$username', '$code');"
echo "\e[32mUser added!\e[0m
SiterCODE for your user is \"$code\".
Open \e[4;34mhttp://localhost/sitercode/\e[0m to setup password for your new user or give this code to someone else.
You won't be able to login until you set the password."
