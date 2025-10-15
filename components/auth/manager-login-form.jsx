"use client"
import { useState } from "react"
import { useForm } from "react-hook-form"
import { useRouter } from "next/navigation"
import Image from "next/image"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useTranslation } from "react-i18next"
import toast from "react-hot-toast"
import { useUser } from "@/context/UserContext"
import { Checkbox } from "@/components/ui/checkbox"
import logo from "@/public/images/logo/logo_tracegrid.png"
import { setSession } from '@/lib/session'

const ManagerLoginForm = () => {
  const { t } = useTranslation()
  const UserContext = useUser()
  const { setUser, setUserWithProfile } = UserContext.operations // Fixed this line
  const [isLoading, setIsLoading] = useState(false)
  const [isAuthError, setIsAuthError] = useState(false)
  const [isServerError, setIsServerError] = useState(false)
  const [responsStatus, setResponsStatus] = useState("")
  const [isUnexpectedError, setIsUnexpectedError] = useState(false)
  const router = useRouter()

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors }
  } = useForm()

  const handleFetchError = (error) => {
    console.error("Fetch error:", error)
    if (error instanceof TypeError && error.message === "Failed to fetch") {
      setIsServerError(true)
      setResponsStatus("Connection Error")
    } else {
      toast.error("Login Failed")
    }
  }

  const handleResponseError = async (response) => {
    if (response.status === 401) {
      setIsAuthError(true)
    } else if (response.status === 503) {
      setIsServerError(true)
      setResponsStatus("Maintenance")
    } else {
      setIsUnexpectedError(true)
      setResponsStatus("Unexpected Error")
    }
  }

  const onSubmit = async (data) => {
    setIsLoading(true)
    setIsAuthError(false)
    setIsServerError(false)
    setIsUnexpectedError(false)

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_TRACEGRID_API_URL}/tracegrid_api/manager/auth_login`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            username: data.username,
            manager: data.manager, // Different from user login
            password: data.password
          })
        }
      )

      if (!response.ok) {
        await handleResponseError(response)
        return
      }

      const result = await response.json()
      await handleSuccess(result, data)
    } catch (error) {
      handleFetchError(error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSuccess = async (result, data) => {
    const userData = {
      token: result.access_token,
      username: data.username,
      password: data.password,
      role: "manager",
      manager: data.manager,
      customer: null
    }

    // Set user data with profile (for manager, this just sets user directly)
    await setUserWithProfile(userData)

    // Store session and enforce mutual exclusivity (manager vs developer)
    setSession('manager', userData);

    await new Promise((resolve) => setTimeout(resolve, 300))

    // Tunggu sebentar untuk memastikan data tersimpan
    await new Promise((resolve) => setTimeout(resolve, 100))

    // Gunakan router.push alih-alih window.location
    window.location.href = "/manager/dashboard"
  }

  return (
    <div className='w-full py-10'>
      <Image src={logo} alt='' objectFit='cover' height={"100%"} width={"100%"} />
      <div className='2xl:mt-8 mt-6 2xl:text-3xl text-2xl font-bold text-default-900'>
        Welcome  Manager 👋
      </div>
      {isServerError && (
        <div className='login-failed-box border border-red-600 rounded-lg p-4 mt-4'>
          <div className='login-failed-message text-red-600'>
            <p>
              <strong>Login failed:</strong> {responsStatus}
            </p>
            <br />
            {responsStatus === "Maintenance" ? (
              <span>TraceGrid is upgrading, please try again later</span>
            ) : (
              <ul className='list-disc list-inside'>
                <li>Please check if your internet connection is working</li>
                <li>We might be under maintenance, please try again later</li>
              </ul>
            )}
          </div>
        </div>
      )}
      {isAuthError && (
        <div className='login-failed-box border border-red-600 rounded-lg p-4 mt-4'>
          <div className='login-failed-message text-red-600'>
            Login failed: Invalid username, password, or manager code
          </div>
        </div>
      )}
      {isUnexpectedError && (
        <div className='login-failed-box border border-red-600 rounded-lg p-4 mt-4'>
          <div className='login-failed-message text-red-600'>
            Login failed: {responsStatus} <br />
            <br />
            <span>Please try again later</span>
          </div>
        </div>
      )}
      <form onSubmit={handleSubmit(onSubmit)} className='mt-5 2xl:mt-7'>
        <div className='space-y-4'>
          <div>
            <Label htmlFor='username' className='mb-2 font-medium text-default-600'>
              Username{" "}
            </Label>
            <Input {...register("username", { required: true })} type='text' className='h-[48px]' />
            {errors.username && (
              <span className='text-red-500'>{t("general.username_required")}</span>
            )}
          </div>
          <div>
            <Label htmlFor='password' className='mb-2 font-medium text-default-600'>
              Password{" "}
            </Label>
            <Input
              {...register("password", { required: true })}
              type='password'
              className='h-[48px]'
            />
            {errors.password && (
              <span className='text-red-500'>{t("general.password_required")}</span>
            )}
          </div>
          <div>
            <Label htmlFor='manager_code' className='mb-2 font-medium text-default-600'>
              Manager Code{" "}
            </Label>
            <Input {...register("manager", { required: true })} type='text' className='h-[48px]' />
            {errors.manager && (
              <span className='text-red-500'>{t("general.manager_required")}</span>
            )}
          </div>
          <div className='mt-5  mb-8 flex flex-wrap gap-2'>
            <div className='flex-1 flex  items-center gap-1.5 '>
              <Checkbox size='sm' className='border-default-300 mt-[1px]' id='isRemebered' />
              <Label
                htmlFor='isRemebered'
                className='text-sm text-default-600 cursor-pointer whitespace-nowrap'
              >
                Remember me
              </Label>
            </div>
            {/* <Link href="/auth/forgot" className="flex-none text-sm text-primary">
                      Forget Password?
                    </Link> */}
          </div>
          <Button type='submit' className='h-[48px] w-full' disabled={isLoading}>
            {isLoading ? t("Loading") : t("Login")}
          </Button>
        </div>
      </form>
    </div>
  )
}

export default ManagerLoginForm
