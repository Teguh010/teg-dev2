import React from "react"
import * as NavigationMenu from "@radix-ui/react-navigation-menu"
import { menusConfig, filterMenusByGUIElements } from "@/config/menus"
import { getManagerMenus } from "@/config/manager-menus"
import { cn, firstUpperLetter } from "@/lib/utils"
import { ChevronDown } from "lucide-react"
import Link from "next/link"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import image from "@/public/images/all-img/man-with-laptop.png"
import Image from "next/image"
import logo from "@/public/images/logo/logo_mini_tracegrid.png"
import { useTranslation } from "react-i18next"
import { useUser } from "@/context/UserContext"
import { usePathname, useRouter } from "next/navigation"
import { useSelectedCustomerStore } from "@/store/selected-customer"
import { selectCustomer } from "@/models/manager/session"
import { getUserGUIElementsOverview } from "@/models/users"
import toast from "react-hot-toast"
import CustomSelect from "@/components/partials/manager-header/custom-select"

export default function MainMenu({ customMenus }) {
  const {
    models: { userProfileData },
    operations: { getUserRef }
  } = useUser()
  const pathname = usePathname()
  const router = useRouter()
  const { i18n } = useTranslation()
  const currentLocale = i18n.language

  // Determine if current path is manager or client based on pathname only
  const isManagerPath = pathname.includes("/manager")

  // Check userProfileData changes
  React.useEffect(() => {
    // userProfileData changed, check if ready for GUI elements fetch
  }, [userProfileData])

  // State for GUI elements data
  const [guiElements, setGuiElements] = React.useState([])
  const [isLoadingGUI, setIsLoadingGUI] = React.useState(false)

  // Get customer selection state (needed early for menu logic)
  const { selectedCustomerId, setSelectedCustomer, customers, isLoading } =
    useSelectedCustomerStore()

  // Fetch GUI elements when user profile is available
  React.useEffect(() => {
    const fetchGUIElements = async () => {
      
      // Get token from userProfileData or getUserRef
      const token = userProfileData?.token || getUserRef()?.token
      if (!token) {
        return
      }
      
      
      // Get userId from userProfileData (should be available from UserContext)
      let userId = userProfileData?.userId
      
      if (!userId) {
        return
      }
      
      setIsLoadingGUI(true)
      try {
        const elements = await getUserGUIElementsOverview(token, userId)
        setGuiElements(elements)
      } catch (error) {
        console.error("❌ Error fetching GUI elements:", error)
        setGuiElements([])
      } finally {
        setIsLoadingGUI(false)
      }
    }

    // Only fetch if userProfileData is available and has token and userId
    if (userProfileData && userProfileData.token && userProfileData.userId) {
      fetchGUIElements()
    }
  }, [userProfileData, getUserRef])

  // Determine which menus to use based on customMenus and current path
  // Check if customer is selected (for manager menus)
  const hasSelectedCustomer = selectedCustomerId !== null && selectedCustomerId !== undefined
  
  let baseMenus
  if (customMenus?.mainNav) {
    // If customMenus is provided, use it
    baseMenus = customMenus.mainNav
  } else if (isManagerPath) {
    // For manager pages (based on pathname), use dynamic manager menus based on customer selection
    baseMenus = getManagerMenus(hasSelectedCustomer).mainNav || []
  } else {
    // For client pages (based on pathname), use menusConfig
    baseMenus = menusConfig.mainNav || []
  }

  // Apply GUI elements filtering to menus
  const menus = React.useMemo(() => {
    if (isManagerPath) {
      return baseMenus // Manager menus don't need GUI filtering, but need to update on customer change
    }
    if (isLoadingGUI || guiElements.length === 0) {
      return baseMenus // Return unfiltered menus while loading or if no GUI data
    }
    return filterMenusByGUIElements(baseMenus, guiElements, userProfileData?.userTypeId)
  }, [baseMenus, guiElements, isLoadingGUI, userProfileData?.userTypeId, hasSelectedCustomer, isManagerPath])

  const { t } = useTranslation()
  const [offset, setOffset] = React.useState()
  const [list, setList] = React.useState()
  const [value, setValue] = React.useState()

  const [selectedValue, setSelectedValue] = React.useState(selectedCustomerId?.toString() || "")

  const customerOptions = customers.map((customer) => ({
    value: customer.id.toString(),
    label: customer.name
  }))

  const handleCustomerSelect = async (value) => {
    if (!isManagerPath) return

    setSelectedValue(value)
    const currentUser = getUserRef()
    if (!currentUser?.token) return

    try {
      const customer = customers.find((c) => c.id === Number(value))
      if (!customer) return

      const response = await selectCustomer(currentUser.token, customer.id)
      if (response?.success) {
        setSelectedCustomer(customer.id, customer.name)
        
        //if on dashboard page, redirect to module overview
        if (pathname.includes("/manager/dashboard")) {
          router.push(`/${currentLocale}/manager/moduleoverview`)
        }
      } else {
        // Check if it's a session expired error
        if (response?.message?.includes('Session expired')) {
          toast.error(t("error.session_expired"))
        } else {
          toast.error(t("error.select_customer"))
        }
      }
    } catch (error) {
      console.error("Error selecting customer:", error)
      // Check if it's a session expired error
      if (error?.message?.includes('Session expired')) {
        toast.error(t("error.session_expired"))
      } else {
        toast.error(t("error.select_customer"))
      }
    }
  }

  const onNodeUpdate = (trigger, itemValue) => {
    if (trigger && list && value === itemValue) {
      const triggerOffsetLeft = trigger.offsetLeft + trigger.offsetWidth / 6

      setOffset(Math.round(triggerOffsetLeft))
    } else if (value === "") {
      setOffset(null)
    }
    return trigger
  }

  return (
    <div>
      <NavigationMenu.Root onValueChange={setValue} className=' flex relative  justify-start group'>
        <NavigationMenu.List ref={setList} className='group flex list-none gap-5'>
          <Link
            href={isManagerPath ? "/manager/dashboard" : "/map"}
            className=' text-primary flex items-center gap-2'
            target='_blank'
            rel='noopener noreferrer'
          >
            <Image src={logo} alt='' objectFit='cover' className=' mx-auto text-primary h-8 w-8' />
          </Link>
          {isManagerPath && (
            <div className='pt-2.5'>
              <CustomSelect
                value={selectedValue}
                onChange={handleCustomerSelect}
                options={customerOptions}
                placeholder="Select Customer"
                className='min-w-[200px]'
                onClear={async () => {
                  setSelectedValue("")

                  const currentUser = getUserRef()
                  if (!currentUser?.token) return

                  try {
                    const response = await selectCustomer(currentUser.token, 0)
                    if (response?.success) {
                      setSelectedCustomer(null, null)
                    } else {
                      toast.error("Error Selecting Customer")
                    }
                  } catch (error) {
                    console.error("Error deselecting customer:", error)
                    toast.error("Error deselecting Customer")
                  }
                }}
              />
            </div>
          )}
          {menus?.map((item, index) => (
            <NavigationMenu.Item key={`item-${index}`} value={item}>
              {!item.child && !item.megaMenu ? (
                <Link
                  href={item.href}
                  className='flex items-center py-4 cursor-pointer hover:text-primary'
                >
                  <item.icon className='h-5 w-5 mr-2' />
                  <span className='text-sm font-medium text-default-700'>{firstUpperLetter(t(item.title))}</span>
                </Link>
              ) : (
                <>
                  <NavigationMenu.Trigger
                    ref={(node) => onNodeUpdate(node, item)}
                    asChild
                    className='flex items-center'
                  >
                    <div
                      className='flex items-center py-4 cursor-pointer group data-[state=open]:text-primary'
                      aria-controls={`radix-:rd:-content-${index}`}
                      id={`radix-:rd:-trigger-${index}`}
                    >
                      <item.icon className='h-5 w-5 mr-2' />
                      <span className='text-sm font-medium text-default-700'>{firstUpperLetter(t(item.title))}</span>
                      <ChevronDown
                        className='relative top-[1px] ml-1 h-4 w-4 transition duration-200 group-data-[state=open]:rotate-180'
                        aria-hidden='true'
                      />
                    </div>
                  </NavigationMenu.Trigger>
                  <NavigationMenu.Content
                    id={`radix-:rd:-content-${index}`}
                    key={`${item.title}-${index}`}
                    aria-labelledby={`radix-:rd:-trigger-${index}`}
                    aria-owns={`radix-:rd:-content-${index}`}
                    className={cn(
                      "w-full rounded-md border bg-popover text-popover-foreground shadow-lg"
                    )}
                  >
                    {/* Existing content for dropdown menus */}
                    {item.child && (
                      <div className='min-w-[200px] p-4'>
                        {item.child?.map((childItem, index) => (
                          <ListItem
                            className='text-sm font-medium text-default-700'
                            key={`${childItem.title}-${index}`}
                            title={t(childItem.title)}
                            href={childItem.href}
                            childItem={childItem}
                          >
                            <childItem.icon className='h-5 w-5' />
                          </ListItem>
                        ))}
                      </div>
                    )}

                    {/* Existing megaMenu content */}
                    {item.megaMenu && (
                      <div className=''>
                        <Tabs
                          defaultValue={item.megaMenu[0].title}
                          onValueChange={setValue}
                          className='inline-block p-0'
                        >
                          <TabsList className='bg-transparent p-0 border-b-2 py-7 px-[30px] rounded-none w-full justify-start gap-10'>
                            {item.megaMenu?.map((tab, index) => (
                              <TabsTrigger
                                key={`${tab.title}-${index}`}
                                value={tab.title}
                                className='data-[state=active]:shadow-none  data-[state=active]:bg-transparent data-[state=active]:text-primary transition duration-150 before:transition-all before:duration-150 relative before:absolute
                                before:left-1/2 before:-bottom-[30px] before:h-[2px] px-0
                                before:-translate-x-1/2 before:w-0 data-[state=active]:before:bg-primary data-[state=active]:before:w-full'
                              >
                                <tab.icon className='h-5 w-5 mr-2' />
                                <span className='text-sm font-medium text-default-700'>
                                  {firstUpperLetter(tab.title)}
                                </span>
                              </TabsTrigger>
                            ))}
                          </TabsList>

                          {item.megaMenu?.map((tab, index) => (
                            <TabsContent
                              key={`${tab.title}-${index}`}
                              value={tab.title}
                              className={cn(" grid grid-cols-12 gap-4 px-6 py-2", {
                                "gap-2": tab?.child?.length < 10
                              })}
                            >
                              <div
                                className={cn("col-span-8  grid gap-3 grid-cols-3", {
                                  "col-span-5 grid-cols-1  ": tab?.child?.length < 10
                                })}
                              >
                                {tab?.child?.map((megaChild, index) => (
                                  <ListItem
                                    className='mb-0 text-sm font-medium text-default-600'
                                    key={`${megaChild.title}-${index}`}
                                    title={firstUpperLetter(t(megaChild.title))}
                                    href={megaChild.href}
                                    childItem={megaChild}
                                  />
                                ))}
                              </div>
                              <div
                                className={cn("col-span-4 ", {
                                  "col-span-7 ": tab?.child?.length < 10
                                })}
                              >
                                <div className='h-full w-full  text-center'>
                                  <Image
                                    src={image}
                                    alt=''
                                    objectFit='cover'
                                    height={"100%"}
                                    width={"100%"}
                                  />
                                </div>
                              </div>
                            </TabsContent>
                          ))}
                        </Tabs>
                      </div>
                    )}
                  </NavigationMenu.Content>
                </>
              )}
            </NavigationMenu.Item>
          ))}
        </NavigationMenu.List>

        <div className=' absolute  top-full '>
          <NavigationMenu.Viewport
            style={{
              display: !offset ? "none" : undefined,
              transform: `translateX(${offset}px)`,
              top: "100%",
              transition: "all 0.5s ease"
            }}
          />
        </div>
      </NavigationMenu.Root>
    </div>
  )
}

const ListItem = React.forwardRef(
  ({ className, children, title, childItem, ...props }, forwardedRef) => {
    const { t } = useTranslation()
    const pathname = usePathname()
    const router = useRouter()
    const {
      models: { userProfileData }
    } = useUser()
    const isManagerPath = pathname.includes("/manager")
    const isActive = pathname === childItem.href

    const handleClick = (e) => {
      if (isActive && isManagerPath && childItem.href.includes("/manager/")) {
        e.preventDefault()
        window.location.reload()
      }
    }

    return (
      <NavigationMenu.Link asChild>
        <Link
          className={cn(
            " select-none   text-sm  text-default-700 rounded-md flex  items-center gap-2 mb-4 last:mb-0  leading-none no-underline outline-none transition-colors  hover:text-primary  focus:text-primary",
            className
          )}
          {...props}
          ref={forwardedRef}
          onClick={handleClick}
        >
          <div>{children}</div>
          <div>{firstUpperLetter(t(title))}</div>
        </Link>
      </NavigationMenu.Link>
    )
  }
)
