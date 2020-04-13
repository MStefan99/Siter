create table users
(
	id               integer not null
		constraint users_pk
			primary key autoincrement,
	username         text    not null,
	password_hash    text,
	setup_code       text,
	is_admin         integer default 0 not null,
	can_manage_users integer default 0 not null
);

create unique index users_id_uindex
	on users (id);

create unique index users_setup_code_uindex
	on users (setup_code);

create unique index users_username_uindex
	on users (username);


create table sessions
(
	id integer
		constraint sessions_pk
			primary key autoincrement,
	user_id integer not null
		references users
			on update cascade on delete cascade,
	cookie_id text not null,
	ip_address text not null,
	os text not null,
	last_login text not null
);

create unique index sessions_id_uindex
	on sessions (id);
