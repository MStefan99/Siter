#!/bin/sh

#curl -sL https://deb.nodesource.com/setup_12.x | sudo -E bash - &&
#sudo apt-get update &&
#sudo apt-get install nodejs sqlite3 -y &&
#npm install

echo "Do you want to add an admin user? ([yes]/no):"
while true; do
	read -r ans

	if [ "$ans" = "yes" ] || [ -z "$ans" ]; then
		echo "Please enter username for your admin user [admin]:"
		read -r username
		if [ -z "$username" ]; then
			username="admin"
		fi
		sqlite3 ./database/users.sqlite "$(cat ./database/ddl/users.sql)"
		sqlite3 ./database/users.sqlite "
		insert into users(username, setup_code, is_admin, can_manage_users)
		values ('$username', 'admin_setup_code', 1, 1);"
		echo "\e[32mAdmin user added.\e[0m Open \e[4;34mhttp://localhost/sitercode/\e[0m to setup password for your new user.
You won't be able to login until you set the password.
Your admin SiterCODE is \"admin_setup_code\".
\e[31mWARNING: DO NOT SHARE THIS CODE! WITH THIS CODE ANYONE CAN GET FULL ACCESS TO YOUR SERVER!
YOU MAY NOT BE ABLE TO REMOVE ADMIN USER ADDED BY SOMEONE ELSE!\e[0m"
		break

	elif [ "$ans" = "no" ]; then
		echo "You can add users later by running add_user.sh"
		break
	fi
	echo "Please enter 'yes' or 'no':"
done
