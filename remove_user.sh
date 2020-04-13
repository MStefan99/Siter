#!/bin/sh

echo "Please enter username to remove:"
while true; do
	read -r username
	if [ -z "$username" ]; then
		echo "Username cannot be empty! Please enter new username:"
	else
		break
	fi
done

while true; do
	echo "\e[31mCONFIRM REMOVAL. THIS ACTION CANNOT BE UNDONE! (yes/no):\e[0m"
	read -r confirmation
	if [ "$confirmation" = "yes" ]; then
		sqlite3 ./database/users.sqlite "
			pragma foreign_keys = on;
			delete from users where username = '$username' and is_admin != 1"
		echo "\e[32mUser removed!\e[0m"
		break
	elif [ "$confirmation" = "no" ]; then
		echo "Canceled."
		break
	else
		echo "You need to confirm the action by typing \"yes\". You can cancel by typing \"no\"."
	fi
done
