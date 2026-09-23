import type { Profile } from '../../api';

export default function ProfileView({ profile }: { profile: Profile }) {
  const initials = profile.name
    .split(' ')
    .map((p) => p[0])
    .join('')
    .slice(0, 2);
  const rows: [string, string][] = [
    ['Roll number', profile.rollNo],
    ['Course', `${profile.course} · ${profile.branch}`],
    ['Department', profile.department],
    ['Semester', String(profile.semester)],
    ['Section', profile.section],
    ['Batch', profile.batch],
    ['PBL group', profile.pblGroup ?? '—'],
    ['College email', profile.email],
  ];

  return (
    <>
      <header className="view-head">
        <h2>My profile</h2>
        <p>Your academic details as recorded by the university.</p>
      </header>
      <section className="card profile">
        <div className="avatar" aria-hidden>
          {initials}
        </div>
        <div>
          <h3>{profile.name}</h3>
          <dl className="details">
            {rows.map(([k, v]) => (
              <div key={k}>
                <dt>{k}</dt>
                <dd>{v}</dd>
              </div>
            ))}
          </dl>
          <p className="muted-text">Something wrong here? Contact your department office to get it corrected.</p>
        </div>
      </section>
    </>
  );
}
