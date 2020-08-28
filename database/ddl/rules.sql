create table rules (
	id        integer not null
		constraint rules_pk
			primary key autoincrement,
	directory text,
	ip        text,
	port      integer
);

create unique index rules_id_uindex
	on rules (id);
