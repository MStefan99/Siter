create table options (
	key   text not null,
	value text
);

create unique index options_key_uindex
	on options (key);

