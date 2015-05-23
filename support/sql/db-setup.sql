drop table if exists items;

-- Sample items
create table if not exists items(
  id bigint not null primary key auto_increment,
  name varchar(255) not null,
  picture_url varchar(1000) not null,
  site_url varchar(2000) null
);
