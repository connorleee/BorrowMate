'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { actionClient, authActionClient } from '@/lib/safe-action'
import { loginSchema, signupSchema, signInWithGoogleSchema } from './schemas'

export const login = actionClient
  .inputSchema(loginSchema)
  .action(async ({ parsedInput: { email, password } }) => {
    const supabase = await createClient()

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      throw new Error(error.message)
    }

    revalidatePath('/', 'layout')
    redirect('/dashboard')
  })

export const signup = actionClient
  .inputSchema(signupSchema)
  .action(async ({ parsedInput: { name, email, password } }) => {
    const supabase = await createClient()

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name: name,
        },
      },
    })

    if (error) {
      throw new Error(error.message)
    }

    revalidatePath('/', 'layout')
    redirect('/dashboard')
  })

export const logout = authActionClient
  .action(async ({ ctx: { supabase } }) => {
    await supabase.auth.signOut()
    revalidatePath('/', 'layout')
    redirect('/auth')
  })

export const signInWithGoogle = actionClient
  .inputSchema(signInWithGoogleSchema)
  .action(async () => {
    const supabase = await createClient()
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/auth/callback`,
      },
    })

    if (error) {
      throw new Error(error.message)
    }

    if (data.url) {
      redirect(data.url)
    }
  })
