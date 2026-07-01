import React, { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Handshake, Plus, Rocket, Target, TrendingUp } from 'lucide-react'
import { api } from '@/services/api'
import { useAuth } from '@/hooks/useAuth'
import { ListSearchBar } from '@/components/ui/ListSearchBar'
import { PageHeader } from '@/components/layout/PageHeader'
import { heroBtnPrimary } from '@/components/layout/PageHero'
import { EmptyState } from '@/components/ui/EmptyState'
import { matchesAnySearch } from '@/lib/textSearch'
import { InterviewStatCard } from '@/components/interviews/InterviewStatCard'
import { AnimatedTabNav } from '@/components/motion/AnimatedTabNav'
import { BusinessRequirementListItem } from '@/components/business-requirements/BusinessRequirementListItem'
import { canMutateBusinessRequirement } from '@/permissions'
import {
  BUSINESS_REQUIREMENT_FILTERS,
  businessRequirementSearchFields,
  businessRequirementStats,
  filterBusinessRequirements,
  sortBusinessRequirements,
  type BusinessRequirementFilter,
} from '@/pages/business-requirements/_shared/businessRequirement.utils'
import './list.css'

const BusinessRequirementsList = () => {
  const { user } = useAuth()
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<BusinessRequirementFilter>('ALL')

  const { data: requirements = [], isLoading } = useQuery({
    queryKey: ['businessRequirements'],
    queryFn: api.businessRequirements.list,
  })

  const { data: users = [] } = useQuery({
    queryKey: ['users'],
    queryFn: api.users.list,
  })

  const userNameById = useMemo(() => new Map(users.map((u) => [u.uid, u.name])), [users])

  const searched = useMemo(
    () =>
      requirements.filter((req) =>
        matchesAnySearch(businessRequirementSearchFields(req), searchTerm)
      ),
    [requirements, searchTerm]
  )

  const stats = useMemo(() => businessRequirementStats(searched), [searched])
  const filtered = useMemo(
    () => sortBusinessRequirements(filterBusinessRequirements(searched, statusFilter)),
    [searched, statusFilter]
  )

  const confirmedQueue = useMemo(
    () =>
      searched.filter((r) => r.status === 'ACTIVE' && r.businessStage === 'CONFIRMED'),
    [searched]
  )

  const showConfirmedSpotlight =
    statusFilter === 'ALL' && !searchTerm.trim() && confirmedQueue.length > 0

  const canCreate = canMutateBusinessRequirement(user?.role)
  const setFilter = (id: BusinessRequirementFilter) => setStatusFilter(id)

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500 pb-12">
      <PageHeader
        highlighted
        icon={Handshake}
        eyebrow="Pre-hiring"
        title="Business requirements"
        description="Track client discussions and deal stages before roles enter the hiring workflow."
        actions={
          canCreate ? (
            <Link to="/business-requirements/new" className={heroBtnPrimary}>
              <Plus size={18} />
              New requirement
            </Link>
          ) : undefined
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <InterviewStatCard
          label="All deals"
          value={stats.total}
          icon={Handshake}
          accent="slate"
          active={statusFilter === 'ALL'}
          onClick={() => setFilter('ALL')}
        />
        <InterviewStatCard
          label="In progress"
          value={stats.active}
          icon={TrendingUp}
          accent="blue"
          active={statusFilter === 'ACTIVE'}
          onClick={() => setFilter(statusFilter === 'ACTIVE' ? 'ALL' : 'ACTIVE')}
        />
        <InterviewStatCard
          label="Ready to hire"
          value={stats.confirmed}
          icon={Target}
          accent="amber"
          active={false}
          onClick={() => {}}
        />
        <InterviewStatCard
          label="Opened to hiring"
          value={stats.openToHiring}
          icon={Rocket}
          accent="green"
          active={statusFilter === 'OPEN_TO_HIRING'}
          onClick={() =>
            setFilter(statusFilter === 'OPEN_TO_HIRING' ? 'ALL' : 'OPEN_TO_HIRING')
          }
        />
      </div>

      <div className="list-toolbar">
        <ListSearchBar
          value={searchTerm}
          onChange={setSearchTerm}
          placeholder="Search title, client, department, or stage…"
          className="w-full min-w-0 max-w-none flex-1"
        />
        <AnimatedTabNav
          layoutId="business-requirements-list-filters"
          variant="pill"
          uppercase
          className="list-toolbar-filters shrink-0"
          aria-label="Filter business requirements"
          tabs={BUSINESS_REQUIREMENT_FILTERS.map((tab) => ({ id: tab.id, label: tab.label }))}
          activeId={statusFilter}
          onChange={(id) => setStatusFilter(id as BusinessRequirementFilter)}
        />
      </div>

      {isLoading ? (
        <div className="py-24 text-center text-muted-foreground font-medium">
          Loading business requirements…
        </div>
      ) : searched.length === 0 ? (
        <div className="app-card border-dashed border-primary/15 dark:border-border/60">
          <EmptyState
            icon="handshake"
            title={searchTerm.trim() ? 'No matches' : 'No business requirements yet'}
            description={
              searchTerm.trim()
                ? 'Try a different search or clear filters.'
                : canCreate
                  ? 'Create a requirement while discussing with a client — it stays private until you open it to hiring.'
                  : 'Requirements you manage will appear here.'
            }
          />
          {canCreate && !searchTerm.trim() && (
            <div className="pb-10 flex justify-center">
              <Link to="/business-requirements/new" className={heroBtnPrimary}>
                <Plus size={16} /> New requirement
              </Link>
            </div>
          )}
        </div>
      ) : filtered.length === 0 ? (
        <div className="app-card border-dashed border-primary/10 dark:border-border/70">
          <EmptyState
            icon="filter_list"
            title="Nothing in this view"
            description="Try another filter or search term."
          />
        </div>
      ) : (
        <div className="space-y-10">
          {showConfirmedSpotlight && (
            <section className="space-y-4">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-emerald-500/15 text-emerald-700 dark:text-emerald-300">
                    <Target size={20} />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-primary dark:text-white">
                      Ready to open to hiring
                    </h2>
                    <p className="text-xs font-medium text-primary/50 dark:text-white/50">
                      {confirmedQueue.length} deal{confirmedQueue.length === 1 ? '' : 's'} at Confirmed
                      stage
                    </p>
                  </div>
                </div>
              </div>
              <div className="space-y-3">
                {confirmedQueue.slice(0, 3).map((req) => (
                  <BusinessRequirementListItem
                    key={req.id}
                    requirement={req}
                    accountManagerName={userNameById.get(req.accountManager)}
                    hiringManagerName={userNameById.get(req.hiringManager)}
                    variant="highlight"
                  />
                ))}
              </div>
            </section>
          )}

          <section className="space-y-4">
            {showConfirmedSpotlight && (
              <h2 className="text-lg font-bold text-primary dark:text-white">All requirements</h2>
            )}
            <div className="space-y-3">
              {filtered.map((req) => (
                <BusinessRequirementListItem
                  key={req.id}
                  requirement={req}
                  accountManagerName={userNameById.get(req.accountManager)}
                  hiringManagerName={userNameById.get(req.hiringManager)}
                  variant="default"
                />
              ))}
            </div>
          </section>
        </div>
      )}
    </div>
  )
}

export default BusinessRequirementsList
