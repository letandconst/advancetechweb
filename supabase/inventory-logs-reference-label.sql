alter table public.inventory_logs
  add column if not exists reference_label text;

create or replace function public.sync_inventory_log_reference_label()
returns trigger as $$
declare
  resolved_job_order_code text;
begin
  if new.reference_type = 'job-order' and new.reference_id is not null then
    select job_order_code
      into resolved_job_order_code
      from public.job_orders
     where id = new.reference_id;

    new.reference_label := coalesce(resolved_job_order_code, new.reference_label, 'Job order');
  else
    new.reference_label := coalesce(nullif(new.reference_label, ''), 'Manual adjustment');
  end if;

  return new;
end;
$$ language plpgsql;

drop trigger if exists inventory_logs_reference_label_trigger on public.inventory_logs;

create trigger inventory_logs_reference_label_trigger
  before insert or update of reference_type, reference_id, reference_label
  on public.inventory_logs
  for each row
  execute function public.sync_inventory_log_reference_label();

update public.inventory_logs as logs
   set reference_label = coalesce(job_orders.job_order_code, logs.reference_label, 'Job order')
  from public.job_orders
 where logs.reference_type = 'job-order'
   and logs.reference_id = job_orders.id;

update public.inventory_logs
   set reference_label = 'Manual adjustment'
 where reference_type = 'manual'
   and coalesce(nullif(reference_label, ''), '') = '';

comment on column public.inventory_logs.reference_label is 'Human-readable reference label such as JO-00001 or Manual adjustment';